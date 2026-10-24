from typing import Dict, Any, List

def evaluate_buyer_credit_standing(
    buyer_name: str,
    credit_limit: float,
    current_outstanding: float,
    pending_order_value: float = 0.0
) -> Dict[str, Any]:
    """
    Credit Safeguard Engine:
    Compares total buyer outstanding balance against their pre-approved credit limit.
    When breached, auto-generates a commercial hold advisory framed as an automated
    system ERP compliance parameter, completely shielding sales reps from personal friction.
    """
    projected_total = current_outstanding + pending_order_value
    utilization_pct = (current_outstanding / credit_limit * 100.0) if credit_limit > 0 else 100.0
    projected_utilization_pct = (projected_total / credit_limit * 100.0) if credit_limit > 0 else 100.0
    
    is_breached = current_outstanding > credit_limit
    is_projected_breach = projected_total > credit_limit
    excess_amount = max(0.0, current_outstanding - credit_limit)
    available_headroom = max(0.0, credit_limit - current_outstanding)

    if is_breached:
        status = "BREACHED"
        operational_status = "AUTOMATIC_SHIPMENT_HOLD"
        risk_level = "HIGH"
        advisory_title = "Automated System Credit Hold Triggered"
        diplomatic_explanation = (
            f"Dear {buyer_name} Accounts Team, our enterprise ERP system has placed a provisional operational "
            f"dispatch hold on upcoming consignments as current outstanding (₹{current_outstanding:,.2f}) exceeds "
            f"the pre-configured credit parameter (₹{credit_limit:,.2f}) by ₹{excess_amount:,.2f}. "
            f"A payment remittance of ₹{excess_amount:,.2f} will instantly restore automated dispatch authorization."
        )
    elif is_projected_breach:
        status = "NEAR_LIMIT_WARNING"
        operational_status = "CONDITIONAL_APPROVAL"
        risk_level = "MEDIUM"
        advisory_title = "Credit Limit Reaching Capacity (80%+)"
        diplomatic_explanation = (
            f"Current credit utilization is at {utilization_pct:.1f}%. Processing the new order of "
            f"₹{pending_order_value:,.2f} will breach the credit threshold. Consider settling pending invoices "
            f"to ensure uninterrupted consignment fulfillment."
        )
    else:
        status = "HEALTHY"
        operational_status = "DISPATCH_AUTHORIZED"
        risk_level = "LOW"
        advisory_title = "Credit Standing Verified"
        diplomatic_explanation = (
            f"Buyer account is within normal credit parameters. Available credit headroom: ₹{available_headroom:,.2f}."
        )

    return {
        "buyer_name": buyer_name,
        "credit_limit": credit_limit,
        "current_outstanding": current_outstanding,
        "pending_order_value": pending_order_value,
        "utilization_pct": round(utilization_pct, 1),
        "projected_utilization_pct": round(projected_utilization_pct, 1),
        "status": status,
        "operational_status": operational_status,
        "risk_level": risk_level,
        "excess_amount": round(excess_amount, 2),
        "available_headroom": round(available_headroom, 2),
        "advisory_title": advisory_title,
        "diplomatic_explanation": diplomatic_explanation,
        "safeguard_policy_notice": (
            "Notice: Dispatch releases are governed by automated ERP credit controls to comply with internal "
            "statutory audit guidelines."
        )
    }
