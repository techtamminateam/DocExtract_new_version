import os
import operator
import asyncio
import threading
from typing import TypedDict, Annotated, Sequence

from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, SystemMessage

from chatbot.tools import AIEXTRACTER_TOOLS, execute_query
tools = [execute_query, *AIEXTRACTER_TOOLS]

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

system =  """
You are the AIExtracter assistant for a Flask + React document intelligence platform.
You know the app architecture:
- Frontend: React upload screen, preset templates, extraction progress, results review, verify/edit mode, dashboard/history view, cloud integration with Google Drive and OneDrive.
- Backend: Flask APIs for PDF extraction, extraction history, extraction status, templates, chat, and cloud file extraction.
- Main user flow: upload PDF → choose preset or custom fields → POST /api/extract → show JSON results; dashboard/history metrics; cloud integration routes for file selection and extraction.
You have access to this PostgreSQL schema:
- extraction_records(id, template_name, timestamp, pdf_filename, data_points JSON, results JSON)
- extraction_result_status(id, pdf_filename, result_status JSON)
- templates(id, template_name, template_content, data_points JSON, created_at)
- chat_history(id, session_id, role, content, timestamp)
- users(id, email, password, verification_code, is_verified, created_at)
Instructions:
- Answer using DB results and app data only.
- Use headings, bullets, and markdown tables.
- Convert field names into readable labels.
- Summarize large datasets instead of listing every row.
- Never expose passwords or verification codes.
- If nothing matches, reply briefly and helpfully.
- Do not return raw SQL tuples, JSON, or database objects unless explicitly requested."""

def build_graph():
    llm = ChatGoogleGenerativeAI(google_api_key=os.getenv("GEMINI_API_KEY"), model="gemini-2.5-flash", temperature=0.2).bind_tools(tools)
 
    def agent_node(state: AgentState):
        messages = [{"role": "system", "content": system}] + state["messages"]
        response = llm.invoke(messages)
        return {"messages": [response]}
 
    def should_continue(state: AgentState) -> str:
        last = state["messages"][-1]
        return "tools" if last.tool_calls else "__end__"
 
    tool_node = ToolNode(tools)
 
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
 
    return graph.compile()

_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph

def invoke_graph(state):
    """Safely invoke the graph in a Flask thread context."""
    # Set up event loop FIRST - before building graph
    # ChatGoogleGenerativeAI needs event loop during initialization
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Now it's safe to build the graph
        graph = get_graph()
        return graph.invoke(state)
    finally:
        loop.close()
        asyncio.set_event_loop(None)