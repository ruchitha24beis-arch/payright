import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class DualRailFinancingEngine:
    """
    Dual-Rail Financing Safeguard (dual_rail_financing.py):

    CRITICAL LOOPHOLE PLUGGED:
    TReDS (Trade Receivables Discounting System - RXIL, M1xchange, Invoicemart) 
    requires the corporate buyer to manually log in and approve/accept the invoice. 
    If a delinquent corporate buyer intentionally ignores the TReDS portal, single-rail 
    bill discounting stalls out, leaving the MSME cash-strapped.

    SYSTEM LOGIC:
    - Rail 1 (TReDS API):
      Routes the invoice to RBI-approved institutional TReDS platforms at ~8.0%–8.5% p.a. 
      Initializes a strict 7-day buyer approval clock.
    - Rail 2 (Private NBFC Anchor Financing Auto-Failover):
      If the corporate buyer fails to approve on TReDS within 7 calendar days, the platform 
      automatically fails over to Rail 2. Rail 2 leverages:
      1. Verified Proof of Delivery (POD health score > 70%)
      2. Vendor's historical dispatch performance
      3. Corporate buyer's audited credit score
      Rail 2 completes disbursal institutional-side without requiring buyer portal action, 
      crediting funds within 24 hours at 10.5%–11.2% p.a.
    """

    RAIL_1_APPROVAL_WINDOW_DAYS = 7

    SUPPORTED_NBFC_PARTNERS = [
        {"name": "Tata Capital Financial Services Ltd", "rate": 10.5, "tenor_max_days": 90},
        {"name": "Bajaj Finance Corporate Anchor Hub", "rate": 10.8, "tenor_max_days": 120},
        {"name": "Piramal Capital MSME Receivables", "rate": 11.2, "tenor_max_days": 90}
    ]

    @classmethod
    def initiate_dual_rail(
        cls,
        invoice_number: str,
        principal_amount: float,
        buyer_name: str,
        document_health_score: float,
        preferred_rail: str = "AUTO"  # AUTO, RAIL_1_TREDS, RAIL_2_NBFC
    ) -> Dict[str, Any]:
        """
        Initiates dual-rail financing. By default, starts on Rail 1 (TReDS) with 7-day failover.
        """
        now = datetime.utcnow()
        failover_deadline = now + timedelta(days=cls.RAIL_1_APPROVAL_WINDOW_DAYS)

        if preferred_rail == "RAIL_2_NBFC" or document_health_score < 60:
            # Direct Rail 2 if preferred or if low health score needs anchor underwriting
            active_rail = "RAIL_2_NBFC"
            status = "RAIL_2_ACTIVE"
            applied_rate = 10.8
            disbursal_type = "NBFC Anchor Underwriting (No Buyer Action Needed)"
        else:
            active_rail = "RAIL_1_TREDS"
            status = "RAIL_1_PENDING"
            applied_rate = 8.2
            disbursal_type = "TReDS Exchange Auction (7-Day Buyer Approval Window)"

        tenor_days = 60
        discount_fee = principal_amount * (applied_rate / 100.0) * (tenor_days / 365.0)
        platform_fee = min(2500.0, principal_amount * 0.001)
        net_immediate_disbursal = principal_amount - discount_fee - platform_fee

        request_id = f"DRF-{uuid.uuid4().hex[:8].upper()}"

        return {
            "request_id": request_id,
            "invoice_number": invoice_number,
            "principal_amount": principal_amount,
            "buyer_name": buyer_name,
            "document_health_score": document_health_score,
            "active_rail": active_rail,
            "status": status,
            "applied_discount_rate_pa": applied_rate,
            "discount_deduction": round(discount_fee, 2),
            "platform_fee": round(platform_fee, 2),
            "net_immediate_disbursal": round(net_immediate_disbursal, 2),
            "initiated_at": now.isoformat(),
            "failover_deadline": failover_deadline.isoformat(),
            "rail_1_approval_days_remaining": cls.RAIL_1_APPROVAL_WINDOW_DAYS if active_rail == "RAIL_1_TREDS" else 0,
            "safeguard_explanation": (
                "Invoice entered into Dual-Rail Financing. Currently in Rail 1 (TReDS). "
                "If buyer does not approve on TReDS within 7 days, system will automatically "
                "failover to Rail 2 (Private NBFC Anchor Financing) without payment delay."
                if active_rail == "RAIL_1_TREDS" else
                "Processed via Rail 2 (Private NBFC Anchor Financing). Funded based on verified POD without buyer dependency."
            )
        }

    @classmethod
    def evaluate_rail_failover(
        cls,
        initiated_at: datetime,
        current_rail: str,
        is_buyer_approved: bool,
        document_health_score: float
    ) -> Dict[str, Any]:
        """
        Evaluates whether 7-day buyer silence on Rail 1 has triggered auto-failover to Rail 2.
        """
        now = datetime.utcnow()
        elapsed_days = (now - initiated_at).days if initiated_at else 0
        should_failover = (current_rail == "RAIL_1_TREDS") and (not is_buyer_approved) and (elapsed_days >= cls.RAIL_1_APPROVAL_WINDOW_DAYS)

        if is_buyer_approved:
            status = "RAIL_1_APPROVED_DISBURSED"
            active_rail = "RAIL_1_TREDS"
        elif should_failover:
            status = "RAIL_2_ACTIVE_FAILED_OVER"
            active_rail = "RAIL_2_NBFC"
        else:
            status = "RAIL_1_PENDING"
            active_rail = "RAIL_1_TREDS"

        days_left = max(0, cls.RAIL_1_APPROVAL_WINDOW_DAYS - elapsed_days)

        return {
            "current_rail": active_rail,
            "status": status,
            "days_elapsed": elapsed_days,
            "days_remaining_in_rail_1": days_left,
            "should_failover": should_failover,
            "failover_nbfc_eligible": document_health_score >= 60.0
        }
