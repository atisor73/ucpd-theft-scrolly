#!/usr/bin/env python3

import json
from collections import Counter
from pathlib import Path


SOURCE_PATH = Path("public/geo/buildings_hydepark_region.geojson")
OUTPUT_PATH = Path("public/geo/uchicago-buildings.geojson")

# First-pass ownership strings seen in the source data.
OWNER_MATCHES = {
    "UNIVERSITY OF CHICAGO",
    "U OF CHICAGO",
    "UNIVESRITY OF CHICAGO",
    "UNIVESRSITY OF CHICAGO",
}

# Extra campus-map-informed building names that may not always carry a clear owner field.
# This list is intentionally conservative: it is meant to help recover obvious core-campus
# buildings without sweeping in unrelated Hyde Park institutions.
NAME_KEYWORDS = [
    "REGENSTEIN LIBRARY",
    "CRERAR LIBRARY",
    "HARPER LIBRARY",
    "HARPER MEMORIAL LIBRARY",
    "MANSUETO LIBRARY",
    "ROCKEFELLER MEMORIAL CHAPEL",
    "HUTCHINSON COMMONS",
    "REYNOLDS CLUB",
    "COBB HALL",
    "SWIFT HALL",
    "ROSENWALD HALL",
    "RYERSON",
    "KENT CHEMICAL",
    "ECKHART HALL",
    "PICK HALL",
    "WIEBOLDT HALL",
    "GREEN HALL",
    "KELLY HALL",
    "STUART HALL",
    "HASKELL HALL",
    "MANDEL HALL",
    "GOODSPEED HALL",
    "SNELL HALL",
    "JONES LABORATORY",
    "KERSTEN PHYSICS",
    "KNAPP CENTER",
    "KOVLER",
    "ERMAN BIOLOGY",
    "GCIS",
    "GORDON CENTER FOR INTEGRATIVE SCIENCE",
    "LAW SCHOOL",
    "LAIRD BELL LAW QUADRANGLE",
    "RATNER",
    "LOGAN CENTER",
    "BOOKSTORE",
    "ROBIE HOUSE",
    "YOUNG MEMORIAL",
    "COURT THEATER",
    "SMART MUSEUM",
    "MAX PALEVSKY",
    "BURTON-JUDSON",
    "CATHEY",
    "CROWN FAMILY SCHOOL",
    "DAVID RUBENSTEIN FORUM",
]


def normalize(value):
    return str(value or "").strip().upper()


def match_reason(properties):
    name1 = normalize(properties.get("BLDG_NAME1"))
    name2 = normalize(properties.get("BLDG_NAME2"))
    combined = f"{name1} {name2}".strip()

    if name2 in OWNER_MATCHES:
        return "owner_field"

    if any(token in combined for token in OWNER_MATCHES):
        return "owner_text"

    if any(keyword in combined for keyword in NAME_KEYWORDS):
        return "campus_name"

    return None


def main():
    data = json.loads(SOURCE_PATH.read_text())
    features = data.get("features", [])

    kept = []
    reasons = Counter()

    for feature in features:
        properties = feature.get("properties", {})
        reason = match_reason(properties)

        if not reason:
            continue

        updated = dict(feature)
        updated_properties = dict(properties)
        updated_properties["is_uchicago"] = 1
        updated_properties["uchicago_match_reason"] = reason
        updated["properties"] = updated_properties
        kept.append(updated)
        reasons[reason] += 1

    output = {
        "type": "FeatureCollection",
        "features": kept,
    }

    OUTPUT_PATH.write_text(json.dumps(output))

    print(f"source features: {len(features)}")
    print(f"kept features: {len(kept)}")
    print(f"output: {OUTPUT_PATH}")
    print(f"reason counts: {dict(reasons)}")


if __name__ == "__main__":
    main()
