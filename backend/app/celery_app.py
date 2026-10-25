import os

try:
    from celery import Celery
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    celery_app = Celery(
        "chanakya_tasks",
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=["app.tasks"]
    )
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="Asia/Kolkata",
        enable_utc=True,
        task_track_started=True,
        broker_connection_retry_on_startup=True
    )
except ImportError:
    # Fallback dummy class if celery library is not installed
    class DummyCelery:
        def task(self, *args, **kwargs):
            def decorator(f):
                f.delay = f
                return f
            return decorator

    celery_app = DummyCelery()
