import hashlib
import json
from datetime import date, datetime, timedelta
from typing import Dict, Any, Tuple, Optional

class InvoiceLockEngine:
    """
    15-Day "Deemed Acceptance" Contractual Lock (invoice_lock_engine.py):

    CRITICAL LOOPHOLE PLUGGED:
    Under Section 2(b) of the MSMED Act, an objection by the buyer regarding 
    the quality or quantity of goods/services must be made within 15 days of 
    the day of delivery. 
    In practice, corporate buyers frequently raise frivolous, manufactured 
    disputes past 30-45 days solely to delay disbursements.

    SYSTEM LOGIC:
    1. Every generated invoice and delivery challan incorporates a statutory 
       Smart Contract Deemed Acceptance Clause:
       "Notice of Statutory Acceptance: Consignment delivered on {delivery_date}. 
       Under MSMED Act Sec 2(b) and contract terms, any dispute or quality objection 
       must be formally logged on the platform within 15 calendar days (by {lock_date}). 
       If no formal objection is registered by said deadline, materials and billing are 
       contractually, irreversibly DEEMED ACCEPTED without recourse to retroactive dispute."
    2. Automatically tracks elapsed days from delivery date.
    3. If 15 days expire without a logged dispute, status switches to DEEMED_ACCEPTED 
       and an immutable cryptographic audit log is generated, permanently preventing 
       dispute stalling.
    """

    LOCK_WINDOW_DAYS = 15

    @classmethod
    def generate_contractual_clause(cls, delivery_date: date) -> Tuple[str, date]:
        """
        Generates standard 15-day deemed acceptance contractual clause with deadline.
        """
        lock_date = delivery_date + timedelta(days=cls.LOCK_WINDOW_DAYS)
        clause = (
            f"Statutory Deemed Acceptance Clause (MSMED Act Sec 2(b)): "
            f"Physical consignment delivered on {delivery_date.strftime('%d-%b-%Y')}. "
            f"Any technical discrepancy, quantity shortage, or quality objection must be registered on "
            f"the Chanakya portal within 15 calendar days, on or before {lock_date.strftime('%d-%b-%Y')}. "
            f"Upon expiration of this window without formal portal dispute, this invoice and delivered items "
            f"stand irrevocably DEEMED ACCEPTED. No subsequent commercial dispute or payment withholding "
            f"is permissible under statutory audit standards."
        )
        return clause, lock_date

    @classmethod
    def evaluate_acceptance_lock(
        cls,
        delivery_date: Optional[date],
        current_status: str,
        current_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calculates countdown timer or locked state for 15-day deemed acceptance.
        """
        today = current_date or date.today()
        if not delivery_date:
            delivery_date = today

        lock_deadline = delivery_date + timedelta(days=cls.LOCK_WINDOW_DAYS)
        days_elapsed = (today - delivery_date).days
        days_remaining = (lock_deadline - today).days

        is_locked = days_elapsed >= cls.LOCK_WINDOW_DAYS
        is_disputed = current_status == "DISPUTED"

        if is_disputed:
            status = "DISPUTE_ACTIVE"
            label = "Formal Dispute Lodged Within 15 Days"
            color = "red"
        elif is_locked or current_status == "DEEMED_ACCEPTED":
            status = "DEEMED_ACCEPTED"
            label = "Contractually Locked (Deemed Accepted)"
            color = "green"
        else:
            status = "COUNTDOWN_ACTIVE"
            label = f"{days_remaining} Days Remaining to Raise Objection"
            color = "blue"

        return {
            "delivery_date": delivery_date.isoformat(),
            "lock_deadline": lock_deadline.isoformat(),
            "days_elapsed": max(0, days_elapsed),
            "days_remaining": max(0, days_remaining),
            "is_locked": is_locked or current_status == "DEEMED_ACCEPTED",
            "lock_status": status,
            "status_label": label,
            "badge_color": color,
            "statutory_rule": "MSMED Act Section 2(b) 15-Day Dispute Pre-emption Window"
        }

    @classmethod
    def generate_acceptance_audit_log(
        cls,
        invoice_number: str,
        delivery_date: date,
        buyer_gstin: str,
        vendor_gstin: str,
        health_score: float
    ) -> Dict[str, Any]:
        """
        Creates an unalterable SHA-256 cryptographic audit record sealing the deemed acceptance.
        """
        timestamp = datetime.utcnow().isoformat()
        lock_date = delivery_date + timedelta(days=cls.LOCK_WINDOW_DAYS)

        raw_payload = {
            "invoice_number": invoice_number,
            "delivery_date": delivery_date.isoformat(),
            "lock_date": lock_date.isoformat(),
            "buyer_gstin": buyer_gstin,
            "vendor_gstin": vendor_gstin,
            "verified_pod_health_score": health_score,
            "locked_timestamp_utc": timestamp,
            "statutory_foundation": "Section 2(b) MSMED Act (15-Day Silence Clause)"
        }

        serialized = json.dumps(raw_payload, sort_keys=True)
        sha256_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest().upper()

        audit_log = {
            **raw_payload,
            "cryptographic_seal_hash": sha256_hash,
            "legal_standing": "Unconditional Estoppel - Buyer waived right of rejection through 15-day portal silence",
            "enforceability": "Full statutory proof of receipt & deemed acceptance under Section 16 & Section 43B(h)"
        }
        return audit_log
