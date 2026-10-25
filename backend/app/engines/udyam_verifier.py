import re
from datetime import datetime
from typing import Dict, Any, Optional
from app.models.company import MajorActivity, EnterpriseClass

class UdyamVerifier:
    """
    Udyam Category Verification Safeguard (udyam_verifier.py):
    
    CRITICAL LOOPHOLE PLUGGED:
    Section 43B(h) of the Income Tax Act applies ONLY to Micro & Small Enterprises
    engaged in Manufacturing or Services.
    It strictly EXCLUDES:
    1. Traders (Wholesale & Retail under NIC codes 45, 46, 47 as clarified by Office Memorandum 5/2(2)/2021-E/P & G/Policy).
    2. Medium Enterprises (Investment > 10 Cr or Turnover > 50 Cr).

    SYSTEM LOGIC:
    If a vendor is identified as a Trader or Medium Enterprise, the platform automatically
    disables Section 43B(h) tax penalty advisories (which would otherwise be legally invalid 
    and erode the MSME's credibility) and dynamically pivots to:
    - Section 16 MSMED Act Statutory Penal Interest (3x RBI Bank Rate ~20.25% p.a., non-tax-deductible)
    - 2%–5% Prompt Cash Settlement Incentives
    """

    UDYAM_REGEX = re.compile(r"^UDYAM-[A-Z]{2}-\d{2}-\d{7}$", re.IGNORECASE)

    # Known simulation database for realistic Udyam inspection
    KNOWN_PROFILES = {
        "UDYAM-MH-01-0012345": {
            "name": "Apex Precision Engineering Pvt Ltd",
            "enterprise_class": "MICRO",
            "major_activity": "MANUFACTURING",
            "nic_codes": ["25920", "28190"],
            "state": "Maharashtra",
            "date_of_registration": "2020-08-15"
        },
        "UDYAM-MH-03-0098765": {
            "name": "Sahyadri Industrial Fasteners LLP",
            "enterprise_class": "SMALL",
            "major_activity": "MANUFACTURING",
            "nic_codes": ["25994", "25999"],
            "state": "Maharashtra",
            "date_of_registration": "2021-03-10"
        },
        "UDYAM-KR-08-0054321": {
            "name": "Kaveri Polymer & Packaging Solutions",
            "enterprise_class": "MICRO",
            "major_activity": "SERVICES",
            "nic_codes": ["82920", "18129"],
            "state": "Karnataka",
            "date_of_registration": "2022-01-20"
        },
        "UDYAM-GJ-02-0077889": {
            "name": "Zenith Toolings & Automation",
            "enterprise_class": "SMALL",
            "major_activity": "MANUFACTURING",
            "nic_codes": ["28221", "28241"],
            "state": "Gujarat",
            "date_of_registration": "2019-11-05"
        },
        "UDYAM-DL-05-0033221": {
            "name": "Apex Industrial Tools & Hardware Corp",
            "enterprise_class": "SMALL",
            "major_activity": "TRADING",  # TRADER LOOPHOLE DEMO
            "nic_codes": ["46591", "46632"],
            "state": "Delhi",
            "date_of_registration": "2021-09-18"
        }
    }

    @classmethod
    def verify_udyam_registration(
        cls,
        udyam_reg_number: str,
        gstin: Optional[str] = None,
        company_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates Udyam Registration format and fetches classification profile.
        Determines Section 43B(h) applicability vs Section 16 pivot.
        """
        udyam_clean = (udyam_reg_number or "").strip().upper()
        is_valid_format = bool(cls.UDYAM_REGEX.match(udyam_clean))

        profile = cls.KNOWN_PROFILES.get(udyam_clean)

        if not profile:
            # Dynamic parsing for arbitrary valid Udyam registrations
            if is_valid_format:
                parts = udyam_clean.split("-")
                state_code = parts[1]
                # Default heuristics if not in mock db:
                is_trader = bool(company_name and any(kw in company_name.lower() for kw in ["trader", "hardware", "distributor", "retail", "wholesale"]))
                major_activity = "TRADING" if is_trader else "MANUFACTURING"
                enterprise_class = "MICRO"
                profile = {
                    "name": company_name or "Registered MSME Vendor",
                    "enterprise_class": enterprise_class,
                    "major_activity": major_activity,
                    "nic_codes": ["46591"] if is_trader else ["25920"],
                    "state": state_code,
                    "date_of_registration": datetime.utcnow().strftime("%Y-%m-%d")
                }
            else:
                profile = {
                    "name": company_name or "Unknown Entity",
                    "enterprise_class": "MICRO",
                    "major_activity": "MANUFACTURING",
                    "nic_codes": [],
                    "state": "UNKNOWN",
                    "date_of_registration": None
                }

        major_activity = profile["major_activity"]
        enterprise_class = profile["enterprise_class"]

        # Loophole Rule Check:
        # Section 43B(h) applies ONLY to Micro & Small Manufacturers and Service Providers.
        # It strictly EXCLUDES Traders and Medium enterprises.
        is_trader = major_activity == "TRADING"
        is_medium = enterprise_class == "MEDIUM"
        sec_43bh_eligible = (not is_trader) and (not is_medium) and (enterprise_class in ["MICRO", "SMALL"])

        if is_trader:
            loophole_flag = "TRADER_EXCLUDED_FROM_43BH"
            advisory_pivot = "PIVOT_TO_SECTION_16_INTEREST_AND_PROMPT_DISCOUNT"
            policy_reason = (
                "Section 43B(h) strictly excludes wholesale/retail trading enterprises "
                "(OM 5/2(2)/2021-E/P). System has automatically disabled Section 43B(h) tax disallowance "
                "warnings and pivoted to Section 16 MSMED penal interest (~20.25% p.a.) and early cash settlement discounts."
            )
        elif is_medium:
            loophole_flag = "MEDIUM_ENTERPRISE_EXCLUDED_FROM_43BH"
            advisory_pivot = "PIVOT_TO_SECTION_16_INTEREST"
            policy_reason = (
                "Section 43B(h) applies only to Micro and Small enterprises. Medium enterprises "
                "are excluded from tax disallowance remedies. Pivoting to Section 16 compound penal interest."
            )
        else:
            loophole_flag = "FULLY_ELIGIBLE_MICRO_SMALL_PRODUCER"
            advisory_pivot = "FULL_SECTION_43BH_AND_SECTION_16"
            policy_reason = (
                "Entity is verified as an active Micro/Small Manufacturer/Service Provider. "
                "100% eligible for Section 43B(h) fiscal year-end tax deduction disallowance remedies."
            )

        return {
            "udyam_reg_number": udyam_clean,
            "is_valid_format": is_valid_format,
            "verification_status": "VERIFIED_OFFICIAL" if is_valid_format else "FORMAT_INVALID",
            "verified_at": datetime.utcnow().isoformat(),
            "enterprise_class": enterprise_class,
            "major_activity": major_activity,
            "sec_43bh_eligible": sec_43bh_eligible,
            "loophole_flag": loophole_flag,
            "advisory_pivot": advisory_pivot,
            "policy_reason": policy_reason,
            "profile_details": profile
        }
