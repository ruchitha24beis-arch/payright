import math
from typing import Dict, Any, Optional

def calculate_section_43bh_exposure(
    principal: float,
    corporate_tax_rate: float = 0.30
) -> Dict[str, Any]:
    """
    Section 43B(h) Compliance Engine:
    Under Section 43B(h) of the Indian Income Tax Act, any sum payable to a registered
    Micro or Small enterprise beyond 15 days (or up to 45 days if a written agreement exists)
    is disallowed as a business expense deduction in that financial year and added back
    to corporate taxable profits.
    
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
    rbi_rate: float = 0.0575,
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
            "statutory_rate_annual_percent": round(multiplier * rbi_rate * 100, 2),
            "monthly_rate_percent": round((multiplier * rbi_rate * 100) / 12.0, 4),
            "accrued_interest": 0.0,
            "total_with_interest": round(principal, 2),
            "is_tax_deductible": False,
            "statutory_note": "Under MSMED Act Sec 23, penal interest is non-deductible for corporate income tax."
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

def get_tailored_compliance_advisory(
    principal: float,
    days_overdue: int,
    corporate_tax_rate: float = 0.30,
    buyer_is_tax_loss: bool = False,
    vendor_major_activity: str = "MANUFACTURING",
    vendor_enterprise_class: str = "MICRO",
    rbi_rate: float = 0.0675
) -> Dict[str, Any]:
    """
    Produces dynamic commercial compliance analysis plugging all statutory loopholes:
    
    1. Buyer Net Tax Loss Check:
       If the buyer is in a net loss position, Section 43B(h) disallowed expense has no
       direct tax cash impact. The system automatically pivots to Section 16 penal compound
       interest warnings and early settlement discounts.
       
    2. Vendor Trader / Medium Exemption Check:
       Section 43B(h) excludes Traders and Medium enterprises. In such cases, 43B(h) is disabled
       and Section 16 penal interest is featured.
    """
    tax_info = calculate_section_43bh_exposure(principal, corporate_tax_rate)
    interest_info = calculate_section_16_interest(principal, days_overdue, rbi_rate)

    is_trader = vendor_major_activity.upper() == "TRADING"
    is_medium = vendor_enterprise_class.upper() == "MEDIUM"
    vendor_eligible_43bh = (not is_trader) and (not is_medium)

    if buyer_is_tax_loss:
        active_headline = f"Prevent Non-Deductible Compound Interest Accumulation of ₹{interest_info['accrued_interest']:,.2f}"
        active_subtext = (
            f"Buyer operates at net operating tax loss (Section 43B(h) tax disallowance inactive). "
            f"However, Section 16 MSMED Act penal interest at 3x RBI Rate ({interest_info['statutory_rate_annual_percent']}%) "
            f"compounds monthly and cannot be written off as a deductible business expense under Sec 23."
        )
        primary_safeguard_mode = "BUYER_TAX_LOSS_PIVOT_SEC16"
        tax_cash_impact = 0.0
    elif not vendor_eligible_43bh:
        active_headline = f"Section 16 Penal Interest Advisory: ₹{interest_info['accrued_interest']:,.2f} Accrued"
        active_subtext = (
            f"Vendor is categorized under Udyam as {vendor_major_activity} ({vendor_enterprise_class}). "
            f"Section 43B(h) tax disallowance applies strictly to Micro/Small manufacturers & service units. "
            f"Recoverable under statutory Section 16 compound interest (20.25% p.a.)."
        )
        primary_safeguard_mode = "VENDOR_TRADER_OR_MEDIUM_PIVOT_SEC16"
        tax_cash_impact = 0.0
    else:
        active_headline = f"Clear Invoice to Preserve ₹{tax_info['total_tax_cash_penalty']:,.2f} in Section 43B(h) Deductions"
        active_subtext = (
            f"Unpaid dues will be disallowed under Section 43B(h) of the Income Tax Act at fiscal year-end, "
            f"triggering an immediate corporate tax cash outflow of ₹{tax_info['total_tax_cash_penalty']:,.2f}."
        )
        primary_safeguard_mode = "STANDARD_SECTION_43BH_AND_SEC16"
        tax_cash_impact = tax_info["total_tax_cash_penalty"]

    total_buyer_avoidable_loss = tax_cash_impact + interest_info["accrued_interest"]
    total_buyer_cash_exposure = principal + interest_info["accrued_interest"] + tax_cash_impact

    return {
        "principal": principal,
        "days_overdue": days_overdue,
        "primary_safeguard_mode": primary_safeguard_mode,
        "buyer_is_tax_loss": buyer_is_tax_loss,
        "vendor_eligible_43bh": vendor_eligible_43bh,
        "section_43bh": tax_info,
        "section_16_interest": interest_info,
        "tax_banner_headline": active_headline,
        "tax_banner_subtext": active_subtext,
        "total_buyer_avoidable_loss": round(total_buyer_avoidable_loss, 2),
        "total_buyer_cash_exposure": round(total_buyer_cash_exposure, 2)
    }

def get_commercial_compliance_summary(
    principal: float,
    days_overdue: int,
    corporate_tax_rate: float = 0.30,
    rbi_rate: float = 0.0675
) -> Dict[str, Any]:
    return get_tailored_compliance_advisory(principal, days_overdue, corporate_tax_rate, False, "MANUFACTURING", "MICRO", rbi_rate)
