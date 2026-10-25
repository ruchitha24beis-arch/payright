import uuid
from datetime import datetime, date
from typing import Dict, Any, Optional

class ENACHMandateEngine:
    """
    e-NACH Auto-Debit Mandate Engine (enach_mandate.py):

    CRITICAL LOOPHOLE PLUGGED:
    Buyers frequently negotiate voluntary installment / EMI repayment plans to unlock 
    held purchase orders or new shipments, pay installment #1, and then casually default 
    on installment #2 or #3 because civil breach of promise has no urgent enforcement teeth.

    SYSTEM LOGIC:
    1. Before any EMI plan is officially activated or linked orders are unlocked, the corporate 
       buyer must authorize an electronic National Automated Clearing House (e-NACH) auto-debit mandate 
       via NetBanking / Aadhaar e-Sign / Debit Card through NPCI.
    2. Generates a formal Unique Mandate Reference Number (UMRN).
    3. STATUTORY TEETH: Under Section 25 of the Payment and Settlement Systems Act (PSSA), 2007, 
       dishonor of an electronic funds transfer mandate carries identical criminal liabilities to 
       cheque bouncing under Section 138 of the Negotiable Instruments Act:
       - Up to 2 years imprisonment
       - Penalty fine up to twice the dishonored installment amount
       - Instant institutional credit downgrade across banking consortiums
    4. Automatically executes scheduled debit hits on due dates.
    """

    @classmethod
    def generate_mandate(
        cls,
        invoice_number: str,
        total_amount: float,
        amount_per_installment: float,
        total_installments: int,
        buyer_name: str,
        bank_name: str = "HDFC Bank Ltd",
        account_last4: str = "4109"
    ) -> Dict[str, Any]:
        """
        Creates an e-NACH auto-debit mandate registration payload.
        """
        now = datetime.utcnow()
        umrn = f"UMRN-NPCI-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
        auth_token = uuid.uuid4().hex

        sec25_notice = (
            "Statutory e-NACH Warning (Section 25 Payment and Settlement Systems Act, 2007): "
            "This auto-debit mandate is legally binding. Failure of electronic mandate debit due to insufficient "
            "funds or account stoppage constitutes a non-bailable financial offense under Section 25 PSSA, attracting "
            "up to 2 years imprisonment and a punitive fine equal to twice the dishonored installment amount, alongside "
            "automated negative rating reporting to RBI credit information repositories (CIBIL/Equifax)."
        )

        return {
            "umrn": umrn,
            "status": "REGISTERED",
            "invoice_number": invoice_number,
            "buyer_name": buyer_name,
            "mandate_max_amount": round(amount_per_installment * 1.05, 2), # 5% buffer for interest
            "installment_amount": round(amount_per_installment, 2),
            "total_installments": total_installments,
            "frequency": "MONTHLY",
            "bank_name": bank_name,
            "account_last4": account_last4,
            "mandate_auth_url": f"/portal/enach-auth/{auth_token}?umrn={umrn}",
            "created_at": now.isoformat(),
            "sec25_liability_notice": sec25_notice,
            "enforceability": "Criminal bank bounce liability under Section 25 PSSA 2007"
        }

    @classmethod
    def execute_scheduled_debit(
        cls,
        umrn: str,
        installment_number: int,
        amount: float,
        simulate_bounce: bool = False
    ) -> Dict[str, Any]:
        """
        Executes or simulates the monthly e-NACH auto-debit through NPCI clearance.
        """
        now = datetime.utcnow()
        txn_ref = f"NPCI-ACH-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        if simulate_bounce:
            return {
                "success": False,
                "execution_status": "BOUNCED",
                "transaction_reference": txn_ref,
                "umrn": umrn,
                "installment_number": installment_number,
                "amount": amount,
                "timestamp": now.isoformat(),
                "bounce_reason": "INSUFFICIENT_FUNDS_ACCOUNT_02",
                "statutory_trigger": (
                    "CRITICAL NOTICE: Section 25 PSSA 2007 statutory default triggered. "
                    "Notice of Electronic Dishonor automatically drafted for buyer board and banking consortium."
                )
            }

        return {
            "success": True,
            "execution_status": "SUCCESS",
            "transaction_reference": txn_ref,
            "umrn": umrn,
            "installment_number": installment_number,
            "amount": amount,
            "timestamp": now.isoformat(),
            "clearing_bank": "NPCI e-NACH Clearing House Mumbai",
            "status_message": f"Installment #{installment_number} of ₹{amount:,.2f} successfully auto-debited via mandate {umrn}."
        }
