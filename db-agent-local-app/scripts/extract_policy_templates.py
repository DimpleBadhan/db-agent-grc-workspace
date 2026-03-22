from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


SOURCE_DIR = Path(
    r"C:\Users\Dimple Badhan\Documents\New project 9\compliance_inputs\policy_templates\anthony_new_batch_policies_all_frameworks_combined"
)
OUTPUT_DIR = Path(
    r"C:\Users\Dimple Badhan\Documents\New project 9\db-agent-local-app\template-cache\policy-templates"
)


def slugify(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower()
    return cleaned or "template"


def normalize_text(value: str) -> str:
    text = value.replace("\r", "\n")
    text = text.replace("\u2022", "- ")
    text = text.replace("\uf0b7", "- ")
    replacements = {
        "â€“": "-",
        "â€”": "-",
        "â€˜": "'",
        "â€™": "'",
        'â€œ': '"',
        'â€�': '"',
        "â‰¤": "<=",
        "â‰¥": ">=",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return normalize_text("\n".join(parts))


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    records: list[dict[str, str | int]] = []

    for pdf_path in sorted(SOURCE_DIR.glob("*.pdf")):
        template_name = pdf_path.stem
        extracted_text = extract_pdf_text(pdf_path)
        slug = slugify(template_name)

        text_path = OUTPUT_DIR / f"{slug}.txt"
        json_path = OUTPUT_DIR / f"{slug}.json"

        text_path.write_text(extracted_text, encoding="utf-8")
        payload = {
            "template_name": template_name,
            "source_pdf": str(pdf_path),
            "text_file": str(text_path),
            "character_count": len(extracted_text),
            "extracted_text": extracted_text,
        }
        json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

        records.append(
            {
                "template_name": template_name,
                "slug": slug,
                "source_pdf": str(pdf_path),
                "text_file": str(text_path),
                "json_file": str(json_path),
                "character_count": len(extracted_text),
            }
        )

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Extracted {len(records)} policy templates to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
