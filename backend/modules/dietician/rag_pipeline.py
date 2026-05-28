import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_groq import ChatGroq
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

DATA_DIR   = os.path.join(os.path.dirname(__file__), "data")
INDEX_PATH = os.path.join(os.path.dirname(__file__), "qdrant_index")
COLLECTION = "dietician"


def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )


def build_vector_store():
    print("Loading PDFs from:", DATA_DIR)
    all_docs = []

    pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        print("ERROR: No PDFs found in data/ folder!")
        return None

    for filename in pdf_files:
        path = os.path.join(DATA_DIR, filename)
        loader = PyMuPDFLoader(path)
        docs = loader.load()
        all_docs.extend(docs)
        print(f"  Loaded: {filename} ({len(docs)} pages)")

    print(f"\nTotal pages loaded: {len(all_docs)}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(all_docs)
    print(f"Total chunks: {len(chunks)}")

    print("\nCreating local embeddings...")
    embeddings = get_embeddings()

    # Create local Qdrant client (saves to disk, no server needed)
    client = QdrantClient(path=INDEX_PATH)
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )

    vector_store = QdrantVectorStore(
        client=client,
        collection_name=COLLECTION,
        embedding=embeddings
    )
    vector_store.add_documents(chunks)
    print(f"Index saved to: {INDEX_PATH}")
    return vector_store


def load_vector_store():
    embeddings = get_embeddings()
    client = QdrantClient(path=INDEX_PATH)
    return QdrantVectorStore(
        client=client,
        collection_name=COLLECTION,
        embedding=embeddings
    )


def get_qa_chain():
    if not os.path.exists(INDEX_PATH):
        print("Building index...")
        vector_store = build_vector_store()
        if vector_store is None:
            raise Exception("No PDFs found.")
    else:
        print("Loading existing index...")
        vector_store = load_vector_store()

    retriever = vector_store.as_retriever(search_kwargs={"k": 4})

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3
    )

    prompt = PromptTemplate.from_template("""You are an expert AI dietician and nutrition coach.
Use the following nutrition information to answer the question.
Be specific, practical, and helpful.

Context:
{context}

Question: {question}

Answer:""")

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain
