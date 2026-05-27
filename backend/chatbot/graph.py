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

from chatbot.tools import AIEXTRACTER_TOOLS

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

SYSTEM = SystemMessage(content="""
    You are the AIExtracter Assistant — a smart, helpful AI built into the AIExtracter platform.
    AIExtracter lets users upload PDF documents and extract specific data fields using Google Gemini AI.

    ## Platform Overview
    - **6 Preset Templates**: Healthcare Documents, Financial Statements, MSA Extraction,
        Invoice Checking, Legal Documents, SOW Extraction
    - **Custom Extraction**: Users define their own fields and AI prompts
    - **Cloud Integration**: Google Drive and OneDrive for document management
    - **Verification**: Manual review and editing of extracted results
    - **Export**: Download extracted data to Excel
    - **Analytics**: Dashboard with extraction history and metrics
    
    ## Your Tools usage rules
    - use `get_template_info` to provide detailed information about a specific template when users ask about it.
    - use `list_all_templates_name_only` to provide a simple list of all template names when users ask for available templates.
    - use `list_all_templates_with_details` to provide detailed information about all templates when users ask for it.
    - use `get_recent_extraction_records` to provide users with information about their recent extraction activities when they ask for it.  
    - use `get_extraction_records_by_date_range` to provide users with extraction records within a specified date range when they ask for it.
    - use `get_extraction_record_by_filename` to provide users with extraction records for a specific PDF file when they ask for it.
    - use `get_extraction_result` to provide users with the extracted data and results for a specific PDF file when they ask for it.
    - use `get_extraction_analytics` to provide users with analytics and insights about their extraction activities when they ask for it.
    - use `get_extraction_by_template` to provide users with extraction records for a specific template when they ask for it.
                       
    ## Workflow Guidance You Know
    1. **Upload** → drag-and-drop or Google Drive/OneDrive picker → supports PDF up to 20MB
    2. **Select Template** → choose preset or custom → review/add fields
    3. **Extract** → Gemini processes all fields in one API call → results appear in ~10-30s
    4. **Verify** → review each field, edit incorrect values, flag uncertain ones
    5. **Export** → download as Excel or save to history

    ## Troubleshooting Knowledge
    - **Empty fields**: PDF may be scanned (image-based) — advise OCR conversion first
    - **Wrong values**: Try rephrasing the field prompt to be more specific
    - **Failed extraction**: Check PDF isn't password-protected and is under 20MB
    - **Slow extraction**: Large PDFs with many fields take longer — normal behavior
    - **Cloud sync issues**: Re-authenticate Google Drive / OneDrive in Settings

    ## Response Style
    - Be concise and practical — users are mid-task
    - Use **bold** for field names, template names, and key terms
    - Use bullet points for lists of fields or steps
    - When showing DB data, present it cleanly
    - For how-to questions, give step-by-step guidance
    - Proactively mention related features the user might not know about
""")

def build_graph():
    llm = ChatOpenAI(openai_api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4o-mini", temperature=0.2).bind_tools(AIEXTRACTER_TOOLS)
 
    def agent_node(state: AgentState):
        messages = list(state["messages"])
        response = llm.invoke(messages)
        return {"messages": [response]}
 
    def should_continue(state: AgentState) -> str:
        last = state["messages"][-1]
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        return END
 
    tool_node = ToolNode(AIEXTRACTER_TOOLS)
 
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