from app.database import SessionLocal, Base, engine
from app.init_resource_types import init_resource_types

def init_db():
    Base.metadata.create_all(bind=engine)
    init_resource_types()

def main():
    init_db()

if __name__ == "__main__":
    main() 