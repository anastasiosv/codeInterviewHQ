import pytest
from app import database, models

@pytest.fixture(scope="function", autouse=True)
def setup_db():
    # Create tables
    models.Base.metadata.create_all(bind=database.engine)
    yield
    # Drop tables after test
    models.Base.metadata.drop_all(bind=database.engine)
