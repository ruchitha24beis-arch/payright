import math
from typing import Dict, Any

def calculate_section_43bh_exposure(principal: float, corporate_tax_rate: float = 0.30) -> Dict[str, Any]:
    """
    Section 43B(h) Compliance Engine:
    Under Section 43B(h) of the Indian Income Tax Act (effective FY 2023-24),
    any sum payable to a registered Micro or Small enterprise beyond 15 days
    (or up to 45 days if written agreement exists) is disallowed as a business
    expense deduction in that financial year and added back to taxable profits.
    
    This calculates:
    - Direct corporate income tax deduction lost
    - Effective extra tax liability at buyer's corporate tax rate
    - Advance tax shortfall penalty interest (Sec 234B/C)
    """
    disallowed_expense = principal
    direct_tax_penalty = disallowed_expense * corporate_tax_rate
    # Estimated Sec 234B/C advance tax interest surcharge (~12% p.a. on tax shortfall, estimated for 1 quarter)
    estimated_advance_tax_interest = direct_tax_penalty * 0.03
    total_tax_cash_impact = direct_tax_penalty + estimated_advance_tax_interest

    return {
        "principal_at_risk": round(principal, 2),
        "corporate_tax_rate": corporate_tax_rate,
        "disallowed_expense_amount": round(disallowed_expense, 2),
        "direct_tax_deduction_loss": round(direct_tax_penalty, 2),
        "estimated_advance_tax_interest": round(estimated_advance_tax_interest, 2),
        "total_tax_cash_penalty": round(total_tax_cash_impact, 2),
        "explanation": (
            f"If uncleared by fiscal year-end, ₹{principal:,.2f} will be disallowed under "
            f"Section 43B(h), inflicting an avoidable direct tax outflow of ₹{direct_tax_penalty:,.2f} "
            f"plus interest on the buyer."
        )
    }

def calculate_section_16_interest(
    principal: float,
    days_overdue: int,
    rbi_rate: float = 0.0675,
    multiplier: float = 3.0
) -> Dict[str, Any]:
    """
    Section 16 MSMED Act Interest Engine:
    Mandates compound interest with monthly rests at 3 times the RBI Bank Rate
    from the appointed day until payment is made.
    Note: Under Section 23 of the MSMED Act, this interest CANNOT be claimed
    as a tax-deductible expense by the buyer!
    """
    if days_overdue <= 0:
        return {
            "days_overdue": 0,
            "statutory_rate_annual": round(multiplier * rbi_rate * 100, 2),
            "accrued_interest": 0.0,
            "total_with_interest": round(principal, 2),
            "is_tax_deductible": False
        }

    annual_rate = rbi_rate * multiplier  # 3 * 6.75% = 20.25% p.a.
    monthly_rate = annual_rate / 12.0
    months = days_overdue / 30.0

    # Compound interest with monthly rests: A = P * (1 + r)^n
    total_with_interest = principal * math.pow(1.0 + monthly_rate, months)
    accrued_interest = total_with_interest - principal

    return {
        "days_overdue": days_overdue,
        "statutory_rate_annual_percent": round(annual_rate * 100, 2),
        "monthly_rate_percent": round(monthly_rate * 100, 4),
        "accrued_interest": round(accrued_interest, 2),
        "total_with_interest": round(total_with_interest, 2),
        "is_tax_deductible": False,
        "statutory_note": "Under MSMED Act Sec 23, penal interest is non-deductible for corporate income tax."
    }

def get_commercial_compliance_summary(
    principal: float,
    days_overdue: int,
    corporate_tax_rate: float = 0.30,
    rbi_rate: float = 0.0675
) -> Dict[str, Any]:
    """
    Produces complete compliance analysis combining Section 43B(h) and Section 16 MSMED Act.
    """
    tax_data = calculate_section_43bh_exposure(principal, corporate_tax_rate)
    interest_data = calculate_section_16_interest(principal, days_overdue, rbi_rate)

    total_buyer_exposure = principal + interest_data["accrued_interest"] + tax_data["total_tax_cash_penalty"]

    return {
        "principal": principal,
        "days_overdue": days_overdue,
        "section_43bh": tax_data,
        "section_16_interest": interest_data,
        "total_buyer_avoidable_loss": round(tax_data["total_tax_cash_penalty"] + interest_data["accrued_interest"], 2),
        "total_buyer_cash_exposure": round(total_buyer_exposure, 2)
    }
