import re
import math
from typing import Dict, Any

# ─── Keyword dictionaries ─────────────────────────────────────────────────────

SEVERE_KEYWORDS = [
    # Direct kill/death threats — covers "kill u", "kill you", "kill him", "kill her", etc.
    r"\bkill\s+(u|you|him|her|them|everyone|all|me)\b",
    r"\bi('m| am| will|'ll) kill\b",
    r"\bgonna kill\b", r"\bima kill\b", r"\bimma kill\b",
    r"\bwanna kill\b", r"\bwant to kill\b",
    r"\bkill ur\b", r"\bkill yourself\b", r"\bkill ur ?self\b",
    r"\bkys\b", r"\bgo die\b",
    r"\bdie in a fire\b", r"\bdeserve to die\b",
    r"\bshoot you\b", r"\bshoot u\b", r"\bslaughter\b",
    r"\bhang yourself\b", r"\bhang ur ?self\b",
    r"\bslit your\b", r"\bcut yourself\b",
    r"\bcommit suicide\b", r"\bget cancer\b", r"\bkill them\b",
    r"\bshould die\b", r"\bhope you die\b", r"\bhope u die\b",
    r"\bdrink bleach\b", r"\bjump off\b",
    r"\bend your life\b", r"\bend ur life\b",
    r"\bburn alive\b", r"\bstab you\b", r"\bstab u\b",
    r"\bbeat you up\b", r"\bbeat u up\b", r"\bsmash your\b",
    r"\bi('ll| will) murder\b", r"\brape\b", r"\bmolest\b",
    r"\bterrorize\b", r"\bbomb\b.*\byou\b",
    # Typo / repeated letter variants
    r"kil+\s+(u|you)\b", r"kys+\b",
]

CYBERBULLYING_KEYWORDS = [
    # Personal attacks & sustained harassment
    r"\bfat ?ass\b", r"\bugly\b", r"\bloser\b", r"\bnobody likes you\b",
    r"\byou'?re pathetic\b", r"\byou('?re| are) worthless\b", r"\bfreak\b",
    r"\bdisgusting\b", r"\bwaste of space\b", r"\bno one cares\b",
    r"\beveryone hates you\b", r"\bstop existing\b",
    r"\bi hate you\b", r"\byou make me sick\b", r"\bpiece of shit\b",
    r"\byou('?re| are) stupid\b", r"\byou('?re| are) a joke\b",
    r"\bgo away\b", r"\bkill ?yourself\b", r"\bnobody wants you\b",
    r"\byou('?re| are) trash\b", r"\byou('?re| are) garbage\b",
    r"\byou('?re| are) useless\b", r"\byou('?re| are) disgusting\b",
    r"\bfuck ?you\b", r"\bfuck off\b", r"\bfuck\b",
    r"\bshit\b", r"\bbullshit\b", r"\bhorseshit\b",
    r"\bbitch\b", r"\bson of a bitch\b",
    r"\basshole\b", r"\bass ?hole\b",
    r"\bwhore\b", r"\bslut\b", r"\bho+\b", r"\btramp\b", r"\bskank\b",
    r"\bcunt\b", r"\bdick\b", r"\bcock\b", r"\bpussy\b",
    r"\bnigger\b", r"\bnigga\b", r"\bfaggot\b", r"\bfag\b",
    r"\bretard\b", r"\bretarded\b", r"\bspastic\b",
    r"\bchink\b", r"\bspic\b", r"\bkike\b", r"\bgook\b",
    r"\btranny\b", r"\bdyke\b",
    r"\bpos\b",  # piece of shit
    r"\bstfu\b", r"\bgtfo\b", r"\bwtf\b",
    r"\byou suck\b", r"\bscrew you\b",
    r"\bmother ?fucker\b", r"\bmf\b", r"\bmotherfucker\b",
    r"\bdumbass\b", r"\bjackass\b",
    r"\bprick\b", r"\bwanker\b", r"\btosser\b",
]

OFFENSIVE_KEYWORDS = [
    # Mild insults & rudeness
    r"\bstupid\b", r"\bdumb\b", r"\bidiot\b", r"\bmoron\b", r"\bcreep\b",
    r"\bjerk\b", r"\bbastard\b", r"\bshut up\b",
    r"\byou stink\b", r"\bscrew you\b",
    r"\bhateful\b", r"\bnasty\b", r"\bpathetic\b",
    r"\blame\b", r"\bloser\b", r"\bnoob\b", r"\bscrub\b",
    r"\bclown\b", r"\bfool\b", r"\bimbecile\b",
    r"\bannoy\w*\b", r"\bcringe\b", r"\bweird\b",
    r"\bhell\b", r"\bdamn\b", r"\bcrap\b", r"\bass\b",
    r"\bsuck\b", r"\blmao\b", r"\bsmh\b",
    r"\bgross\b", r"\bew+\b", r"\byuck\b",
]


def _count_matches(text: str, patterns: list) -> int:
    count = 0
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            count += 1
    return count


def _sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def classify_text(text: str) -> Dict[str, Any]:
    """
    NLP classification pipeline:
    1. Clean & normalise text
    2. Match keyword tiers
    3. Compute weighted toxicity score
    4. Return label + confidence + score
    """
    # Step 1: normalise — keep apostrophes and letters, strip excess whitespace
    cleaned = text.strip().lower()
    # Only remove truly decorative chars, keep letters, digits, spaces, apostrophes, basic punctuation
    cleaned = re.sub(r"[^\w\s'.,!?@#$%&*()-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Step 2: count matches per tier
    severe_hits    = _count_matches(cleaned, SEVERE_KEYWORDS)
    bully_hits     = _count_matches(cleaned, CYBERBULLYING_KEYWORDS)
    offensive_hits = _count_matches(cleaned, OFFENSIVE_KEYWORDS)

    # Step 3: weighted logit
    logit = (severe_hits * 4.0) + (bully_hits * 2.5) + (offensive_hits * 1.0)

    # Normalise to 0-1
    raw_score = min(logit / 6.0, 1.0)   # lower threshold so single hits register

    # Step 4: determine label + confidence
    if severe_hits >= 1 or raw_score >= 0.75:
        label = "Severe Harassment"
        confidence = round(0.85 + min(severe_hits * 0.03, 0.14), 3)
        score = round(max(raw_score, 0.75), 3)
    elif bully_hits >= 1 or raw_score >= 0.40:
        label = "Cyberbullying"
        confidence = round(0.72 + min(bully_hits * 0.04, 0.18), 3)
        score = round(max(raw_score, 0.40), 3)
    elif offensive_hits >= 1 or raw_score >= 0.15:
        label = "Offensive"
        confidence = round(0.60 + min(offensive_hits * 0.05, 0.25), 3)
        score = round(max(raw_score, 0.15), 3)
    else:
        label = "Safe"
        confidence = round(0.92 - raw_score * 0.3, 3)
        score = round(raw_score, 3)

    is_flagged = label in ("Cyberbullying", "Severe Harassment")

    return {
        "label": label,
        "score": round(score, 3),
        "confidence": round(min(confidence, 0.99), 3),
        "is_flagged": is_flagged,
        "cleaned_text": cleaned
    }
