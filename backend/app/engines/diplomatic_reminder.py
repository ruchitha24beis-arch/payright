from typing import Dict, Any, List

class DiplomaticReminderGenerator:
    """
    Diplomatic Reminder Generator:
    Generates polite, relationship-preserving communication templates.
    Strictly avoids legal confrontation, framing reminders through:
    - Section 43B(h) Corporate Tax Shield Preservation
    - Audit reconciliation assistance
    - Early payment cash discounts
    - Flexible EMI installment offerings
    - Automated ERP system safeguards
    """

    @classmethod
    def generate_reminders(
        cls,
        vendor_name: str,
        vendor_udyam: str,
        buyer_name: str,
        invoice_number: str,
        principal_amount: float,
        due_date: str,
        days_overdue: int,
        portal_url: str,
        corporate_tax_rate: float = 0.30,
        cash_discount_pct: float = 2.5
    ) -> Dict[str, Any]:
        tax_loss = principal_amount * corporate_tax_rate
        discount_amount = principal_amount * (cash_discount_pct / 100.0)
        net_discounted_amount = principal_amount - discount_amount

        # Template 1: Tax-Centric Audit & Reconciliation Advisory (Section 43B(h))
        email_tax_advisory = {
            "template_id": "SEC_43BH_TAX_AUDIT",
            "title": "Section 43B(h) Tax Deduction Reconciliation Advisory",
            "subject": f"Statutory Tax Advisory: Ensuring Section 43B(h) Deduction for Invoice #{invoice_number} - {vendor_name}",
            "body": f"""Dear {buyer_name} Accounts & Taxation Team,

We hope this message finds you well.

As part of our periodic statutory compliance and internal audit reviews, we are reconciling all outstanding balances with valued corporate partners to ensure smooth tax reporting for both our organizations.

Under the provisions of Section 43B(h) of the Income Tax Act, business expenditures payable to MSME registered suppliers ({vendor_udyam or 'Udyam Registered Micro/Small Enterprise'}) must be cleared to qualify for full corporate income tax deduction in the current fiscal period.

Invoice Details:
- Invoice Reference: #{invoice_number}
- Outstanding Amount: ₹{principal_amount:,.2f}
- Due Date: {due_date} ({days_overdue} days past agreement date)
- Potential Corporate Tax Disallowance Impact: ₹{tax_loss:,.2f} (at {int(corporate_tax_rate*100)}% tax bracket)

To assist your finance department in preserving this deduction without year-end tax adjustments, we have set up a streamlined self-service reconciliation link:
{portal_url}

Through this link, your team can review the verified delivery proof, apply early-settlement options, or schedule preferred payment dates.

Thank you for your ongoing partnership.

Warm regards,
Finance & Accounts Department
{vendor_name}"""
        }

        whatsapp_tax_advisory = {
            "template_id": "WA_SEC_43BH_POLITE",
            "title": "WhatsApp: Tax Compliance & Deduction Notice",
            "text": f"""*Tax Reconciliation Advisory | {vendor_name}*

Dear {buyer_name} Finance Team,
To ensure your organization can claim full corporate tax deductions under *Section 43B(h)* of the Income Tax Act, we request your reconciliation of *Invoice #{invoice_number}* for *₹{principal_amount:,.2f}*.

Uncleared balance risks an avoidable *₹{tax_loss:,.2f}* tax deduction disallowance for your company at fiscal close.

Access verified invoice, delivery challan & one-click settlement here:
{portal_url}

Thank you for your continued collaboration!"""
        }

        # Template 2: Cash Discount & Commercial Preservation Incentive
        email_early_discount = {
            "template_id": "COMMERCIAL_CASH_DISCOUNT",
            "title": "Early Settlement Commercial Discount Invitation",
            "subject": f"Commercial Incentive: {cash_discount_pct}% Early Clearance Credit on Invoice #{invoice_number}",
            "body": f"""Dear {buyer_name} Treasury & Accounts Team,

We value our enduring commercial association and appreciate your trust in {vendor_name}.

To support mutual cash management and celebrate our partnership, we are pleased to offer an immediate {cash_discount_pct}% Cash Discount on Invoice #{invoice_number} for settlement within the next 5 business days:

- Original Invoice Amount: ₹{principal_amount:,.2f}
- Prompt Payment Credit ({cash_discount_pct}%): -₹{discount_amount:,.2f}
- Net Amount Payable: ₹{net_discounted_amount:,.2f}

You can claim this instant credit directly through your corporate partner portal:
{portal_url}

Our team remains at your service should you require any ledger reconciliations or updated statements.

Sincerely,
Commercial Operations
{vendor_name}"""
        }

        # Template 3: Flexible EMI Installment Offer
        email_emi_offer = {
            "template_id": "FLEXIBLE_EMI_ASSISTANCE",
            "title": "Flexible Cashflow Installment Schedule (EMI)",
            "subject": f"Partnership Assistance: Structured Installment Schedule for Invoice #{invoice_number}",
            "body": f"""Dear {buyer_name} Finance Team,

We understand that working capital cycles fluctuate across quarterly operating environments. Because your commercial relationship is of paramount importance to us, we would be delighted to structure the settlement of Invoice #{invoice_number} (₹{principal_amount:,.2f}) into flexible monthly installments.

Proposed Structure:
- 3 Monthly Payments of ₹{round(principal_amount / 3.0, 2):,.2f}
- No penal interest applied
- Immediate release of ongoing material dispatches upon plan activation

Review and activate your customized installment schedule with a single click:
{portal_url}

We are committed to finding solutions that sustain and grow our business together.

Best regards,
Commercial Accounts
{vendor_name}"""
        }

        # Template 4: Automated ERP Dispatch Safeguard Notice
        whatsapp_erp_safeguard = {
            "template_id": "WA_ERP_DISPATCH_SAFEGUARD",
            "title": "WhatsApp: Automated ERP Dispatch Safeguard Notice",
            "text": f"""*Automated Shipment Safeguard Notice | {vendor_name}*

Dear {buyer_name} Procurement & Logistics Team,
Our automated ERP system has flagged *Invoice #{invoice_number} (₹{principal_amount:,.2f})* as pending beyond standard credit terms.

To prevent our automated warehouse management system from placing a provisional hold on upcoming dispatches, please facilitate reconciliation at:
{portal_url}

We appreciate your prompt assistance to ensure uninterrupted shipment schedules."""
        }

        return {
            "invoice_number": invoice_number,
            "buyer_name": buyer_name,
            "principal_amount": principal_amount,
            "corporate_tax_exposure": round(tax_loss, 2),
            "early_discount_savings": round(discount_amount, 2),
            "templates": {
                "email_tax_advisory": email_tax_advisory,
                "whatsapp_tax_advisory": whatsapp_tax_advisory,
                "email_early_discount": email_early_discount,
                "email_emi_offer": email_emi_offer,
                "whatsapp_erp_safeguard": whatsapp_erp_safeguard
            }
        }
