from __future__ import annotations

import os
import secrets

from fastapi import Header, HTTPException, status


def require_admin_password(
    admin_password: str | None = Header(default=None, alias="admin-password"),
) -> None:
    """FastAPI dependency that protects admin routes.

    Reads the `admin-password` request header and compares it to `ADMIN_PASSWORD`
    from the environment (typically loaded via python-dotenv).
    """

    expected = os.getenv("ADMIN_PASSWORD")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server misconfigured: ADMIN_PASSWORD is not set.",
        )

    if not admin_password or not secrets.compare_digest(admin_password, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )
