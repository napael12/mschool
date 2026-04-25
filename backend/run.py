import os
import logging
import traceback

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

logger.info("Starting mschool-backend — importing create_app...")

try:
    from app import create_app
    logger.info("create_app imported successfully")
except Exception:
    logger.critical("Failed to import create_app:\n%s", traceback.format_exc())
    raise

try:
    app = create_app()
    logger.info("Flask app created successfully")
except Exception:
    logger.critical("create_app() raised an exception:\n%s", traceback.format_exc())
    raise

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(debug=False, host="0.0.0.0", port=port)

