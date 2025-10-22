import os
import sys
from pathlib import Path

# --- KONFIGŪRACIJA ---

# Failas, į kurį bus eksportuojamas visas projekto kodas
OUTPUT_FILE = "nextjs_project_export.txt"

# Aplankai, kurie bus visiškai ignoruojami (ir jų turinys).
# Tai efektyviausias būdas praleisti nereikalingus failus.
EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vscode",
    ".idea",
    "out",
    "build",
}

# Konkretūs failai, kuriuos reikia praleisti.
EXCLUDE_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "app.py",  # Pats šis skriptas
    "project_context_export.txt",  # Kitas eksportavimo skriptas
    "nextjs_project_export.txt"
}

# Failų plėtiniai, kuriuos reikia praleisti (dažniausiai binariniai failai).
EXCLUDE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
    ".webp", ".avif",
    ".woff", ".woff2", ".ttf", ".eot",
    ".mp3", ".wav", ".mp4", ".mov", ".webm",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".zip", ".gz", ".tar",
}

# --- SCENARIJAUS LOGIKA ---

def should_exclude(path, root_dir):
    """
    Patikrina, ar failas ar aplankas turi būti praleistas pagal konfigūracijos taisykles.
    """
    relative_path_str = str(path.relative_to(root_dir))
    
    # 1. Tikriname, ar kelias yra viename iš praleidžiamų aplankų
    parts = Path(relative_path_str).parts
    if any(part in EXCLUDE_DIRS for part in parts):
        return True

    # 2. Tikriname, ar failo pavadinimas yra praleidžiamų sąraše
    if path.name in EXCLUDE_FILES:
        return True
        
    # 3. Tikriname, ar tai .env failas (išskyrus .env.example)
    if path.name.startswith('.env') and path.name != '.env.example':
        return True

    # 4. Tikriname, ar failo plėtinys yra praleidžiamų sąraše
    if path.suffix in EXCLUDE_EXTENSIONS:
        return True
        
    return False

def find_project_files(root_dir):
    """
    Randa visus projekto logikai svarbius failus, taikydamas EXCLUDE taisykles.
    """
    project_files = []
    
    for path in Path(root_dir).rglob('*'):
        if path.is_dir():
            continue
        
        if not should_exclude(path, root_dir):
            project_files.append(path)
            
    # Rūšiuojame pagal kelią, kad išvestis būtų tvarkinga
    return sorted(project_files, key=lambda p: p.relative_to(root_dir))

def export_project():
    """
    Pagrindinė funkcija, kuri surenka failų turinį ir įrašo jį į vieną failą.
    """
    print("🚀 Pradedamas Next.js projekto eksportavimas...")
    
    root_dir = Path(__file__).parent.resolve()
    files_to_export = find_project_files(root_dir)
    
    exported_blocks = []
    total_size = 0
    
    print(f"✅ Rasta {len(files_to_export)} svarbių failų eksportavimui.")

    for file_path in files_to_export:
        try:
            # Naudojame forward slashes, kad būtų universalu (geras stilius)
            header_path = "/".join(file_path.relative_to(root_dir).parts)
            
            # Praleidžiame tuščius failus
            if file_path.stat().st_size == 0:
                print(f"  🟡 Praleistas (tuščias): {header_path}")
                continue

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            block = f"=== {header_path} ===\n{content}\n\n"
            exported_blocks.append(block)
            total_size += len(block.encode('utf-8'))
            
            print(f"  ➕ Įtrauktas: {header_path}")

        except Exception as e:
            print(f"  ❌ KLAIDA skaitant '{header_path}': {e}")
            
    # Sujungiame viską į vieną tekstą
    final_content = "--- START OF NEXT.JS PROJECT EXPORT ---\n\n" + "".join(exported_blocks)
    
    # Įrašome į failą
    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(final_content)
        
        total_kb = total_size / 1024
        print("\n" + "="*50)
        print(f"✅ SĖKMINGAI EKSPORTUOTA!")
        print(f"     Failas: {OUTPUT_FILE}")
        print(f"     Bendra apimtis: {total_kb:.2f} KB")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ KLAIDA: Nepavyko įrašyti į '{OUTPUT_FILE}': {e}")

if __name__ == "__main__":
    export_project()