import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List

class TReDSBridgeSimulator:
    """
    Silent TReDS (Trade Receivables Electronic Discounting System) Bridge:
    Integrates with RBI-approved exchange platforms (RXIL, M1xchange, Invoicemart).
    Allows MSMEs to silently discount accepted corporate invoices at institutional
    bidding rates (7.5%–9.0% p.a.) without buyer friction, crediting funds within 24 hours.
    """

    SUPPORTED_EXCHANGES = [
        {"code": "RXIL", "name": "Receivables Exchange of India Ltd (RXIL)", "avg_discount_rate": 8.1},
        {"code": "M1_XCHANGE", "name": "M1xchange (Mynd Solutions)", "avg_discount_rate": 8.3},
        {"code": "INVOICEMART", "name": "Invoicemart (A.TREDS Ltd)", "avg_discount_rate": 7.9}
    ]

    @classmethod
    def simulate_bid_generation(
        cls,
        invoice_number: str,
        principal_amount: float,
        tenor_days: int = 60,
        exchange_code: str = "RXIL"
    ) -> Dict[str, Any]:
        """
        Simulates institutional financier bids on the TReDS exchange.
        """
        exchange = next((e for e in cls.SUPPORTED_EXCHANGES if e["code"] == exchange_code), cls.SUPPORTED_EXCHANGES[0])
        annual_discount_rate = exchange["avg_discount_rate"]
        
        # Calculate discount haircut for tenor
        tenor_fraction = tenor_days / 365.0
        discount_fee = principal_amount * (annual_discount_rate / 100.0) * tenor_fraction
        platform_fee = min(2500.0, principal_amount * 0.001)  # 0.1% or max 2500
        net_disbursal_amount = principal_amount - discount_fee - platform_fee

        bid_id = f"TRD-{uuid.uuid4().hex[:8].upper()}"

        financiers = [
            {"financier": "State Bank of India (MSME Hub)", "rate": annual_discount_rate - 0.2, "status": "BEST_BID"},
            {"financier": "HDFC Bank Institutional Treasury", "rate": annual_discount_rate, "status": "COMPETITIVE"},
            {"financier": "SIDBI Direct Refinance", "rate": annual_discount_rate + 0.1, "status": "BACKUP"}
        ]

        return {
            "bid_id": bid_id,
            "exchange": exchange["name"],
            "exchange_code": exchange["code"],
            "invoice_number": invoice_number,
            "principal_amount": principal_amount,
            "tenor_days": tenor_days,
            "annual_discount_rate_percent": annual_discount_rate,
            "discount_charge": round(discount_fee, 2),
            "treds_platform_fee": round(platform_fee, 2),
            "net_immediate_disbursal": round(net_disbursal_amount, 2),
            "settlement_timeline": "T+1 Business Day (Within 24 Hours)",
            "recourse": "WITHOUT_RECOURSE (Factor assumes credit risk)",
            "bids": financiers,
            "disbursal_bank_account": "Primary Current A/C (HDFC Bank ****4910)",
            "status": "READY_FOR_EXECUTION"
        }

    @classmethod
    def execute_discount_request(
        cls,
        invoice_number: str,
        principal_amount: float,
        exchange_code: str = "RXIL",
        selected_rate: float = 8.1
    ) -> Dict[str, Any]:
        """
        Executes simulated 24-hr silent bill discounting on TReDS.
        """
        tenor_days = 60
        discount_charge = principal_amount * (selected_rate / 100.0) * (tenor_days / 365.0)
        net_credit = principal_amount - discount_charge - 1500.0
        transaction_ref = f"UTR-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        return {
            "success": True,
            "transaction_reference": transaction_ref,
            "invoice_number": invoice_number,
            "exchange": exchange_code,
            "status": "DISCOUNTED_TREDS",
            "net_credited_amount": round(net_credit, 2),
            "credited_at": datetime.utcnow().isoformat(),
            "commercial_preservation_benefit": (
                "Invoice successfully discounted institutional-side. Buyer pays the exchange "
                "financier on standard credit terms without any collection dispute or supplier friction."
            )
        }
