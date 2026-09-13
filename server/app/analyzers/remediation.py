"""
Remediation Strategy & Cost Estimator.
Calculates residual risk, engineering cost, and selects the optimal recommendation.
"""

from typing import List, Optional
from ..models.schemas import RemediationOption

HOURLY_RATE_INR = 1000  # Standard engineering rate ₹1,000/hr
ACCEPTABLE_RESIDUAL_RISK_THRESHOLD = 30


def generate_remediation_options(
    pkg_name: str,
    current_version: str,
    fixed_version: Optional[str],
    original_risk: int,
    affected_files_count: int = 2,
) -> List[RemediationOption]:
    """
    Generates Update, Replace, and Mitigate options with residual risk and cost estimations.
    """
    options: List[RemediationOption] = []

    # 1. Option: UPDATE
    # F_update = 85% risk reduction
    update_f = 0.85
    residual_update = int(round(original_risk * (1.0 - update_f)))
    # Effort = Base(2.5) + Files(count * 0.5) + VersionGap(1.5) + Testing(1.5)
    effort_update = round(2.5 + (affected_files_count * 0.5) + 1.5 + 1.5, 1)
    cost_update = int(effort_update * HOURLY_RATE_INR)

    target_ver = fixed_version or "latest"
    options.append(
        RemediationOption(
            action="UPDATE",
            target_version=target_ver,
            description=f"Upgrade {pkg_name} from {current_version} to patch version {target_ver}",
            residual_risk=residual_update,
            risk_reduction_percent=int(update_f * 100),
            estimated_effort_hours=effort_update,
            estimated_cost_inr=cost_update,
            recommended=False,
            details={"breaking_changes_risk": "Low", "automated_pr_available": True},
        )
    )

    # 2. Option: REPLACE (Alternative Library)
    # F_replace = 94% risk reduction
    replace_f = 0.94
    residual_replace = int(round(original_risk * (1.0 - replace_f)))
    effort_replace = round(24.0 + (affected_files_count * 4.0), 1)
    cost_replace = int(effort_replace * HOURLY_RATE_INR)

    options.append(
        RemediationOption(
            action="REPLACE",
            target_version=None,
            description=f"Migrate from {pkg_name} to hardened alternative library",
            residual_risk=residual_replace,
            risk_reduction_percent=int(replace_f * 100),
            estimated_effort_hours=effort_replace,
            estimated_cost_inr=cost_replace,
            recommended=False,
            details={"migration_complexity": "High", "refactor_scope": "Multi-module"},
        )
    )

    # 3. Option: MITIGATE (WAF / Input Filter)
    # F_mitigate = 55% risk reduction
    mitigate_f = 0.55
    residual_mitigate = int(round(original_risk * (1.0 - mitigate_f)))
    effort_mitigate = 3.0
    cost_mitigate = int(effort_mitigate * HOURLY_RATE_INR)

    options.append(
        RemediationOption(
            action="MITIGATE",
            target_version=None,
            description=f"Apply runtime schema validation and input sanitization before {pkg_name} invocation",
            residual_risk=residual_mitigate,
            risk_reduction_percent=int(mitigate_f * 100),
            estimated_effort_hours=effort_mitigate,
            estimated_cost_inr=cost_mitigate,
            recommended=False,
            details={"patch_type": "Virtual Patch / WAF rule", "code_changes_needed": False},
        )
    )

    # Calculate optimal recommendation:
    # Filter by Residual Risk <= Threshold (30)
    valid_options = [opt for opt in options if opt.residual_risk <= ACCEPTABLE_RESIDUAL_RISK_THRESHOLD]
    
    if valid_options:
        # argmin(Cost)
        best_option = min(valid_options, key=lambda x: x.estimated_cost_inr)
        best_option.recommended = True
    else:
        # Fallback to option with lowest residual risk
        best_option = min(options, key=lambda x: x.residual_risk)
        best_option.recommended = True

    return options
