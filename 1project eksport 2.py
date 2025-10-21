import os
import sys

# --- KONFIGŪRACIJA ---

# Failas, į kurį bus eksportuojamas visas projekto kodas
OUTPUT_FILE = "2project_code_export.txt"

# Aplankai, kurie bus visiškai ignoruojami (ir jų turinys)
# Tai efektyviausias būdas praleisti nereikalingus failus.
EXCLUDE_DIRS = {
    "__pycache__",
    ".vscode",
    ".idea",
    "auth",      # Autentifikacijos .pickle failai
    "data",      # Duomenų bazė, cache, quotas ir t.t.
    "output",    # Sugeneruoti video, paveikslėliai
    "logs",      # Programos žurnalai
    "temp_covers", # Laikini "cover" failai
    ".git",
}

# Konkretūs .py failai, kuriuos reikia praleisti
EXCLUDE_PY_FILES = {
    "project_exporter.py",      # Pats šis skriptas
    "audio_tuner_gui.py",       # Atskira pagalbinė programa
    "watermarker.py",           # Atskira pagalbinė programa
    "check_pending.py",         # Duomenų bazės tikrinimo skriptas
    "test_custom_image_prompt.py", # Testavimo skriptas
}

# BŪTINI ne .py failai, kuriuos reikia įtraukti
ESSENTIAL_NON_PY_FILES = [
    "channels.json",
    "smm_packages.json",
    "requirements.txt",
    "genres.py", # Nors ir .py, bet veikia kaip konfigūracija, todėl aiškiai įtraukiam
]

# --- SKRIPTO LOGIKA ---

def find_project_files(root_dir):
    """
    Randa visus projekto logikai svarbius failus, taikydamas EXCLUDE taisykles.
    """
    project_files = []
    
    # 1. Automatiškai surandame visus .py failus
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Efektyvus būdas praleisti nereikalingus aplankus
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            if filename.endswith(".py"):
                # Praleidžiame tuščius __init__.py ir specifinius failus
                if filename in EXCLUDE_PY_FILES or filename == "__init__.py":
                    continue
                
                full_path = os.path.join(dirpath, filename)
                project_files.append(os.path.relpath(full_path, root_dir))

    # 2. Pridedame būtinus ne .py failus
    for file_path in ESSENTIAL_NON_PY_FILES:
        if os.path.exists(file_path):
            if file_path not in project_files:
                project_files.append(file_path)
        else:
            print(f"Dėmesio: Būtinas failas '{file_path}' nerastas ir nebus eksportuotas.")
            
    return sorted(project_files)

def export_project():
    """
    Pagrindinė funkcija, kuri surenka failų turinį ir įrašo jį į vieną failą.
    """
    print("🚀 Pradedamas projekto eksportavimas...")
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    files_to_export = find_project_files(root_dir)
    
    exported_blocks = []
    total_size = 0
    
    print(f"Rasta {len(files_to_export)} svarbių failų eksportavimui.")

    for file_path in files_to_export:
        try:
            # Naudojame forward slashes, kad būtų universalu
            header_path = file_path.replace(os.sep, '/')
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            block = f"=== {header_path} ===\n{content}\n\n"
            exported_blocks.append(block)
            total_size += len(block.encode('utf-8'))
            
            print(f"  + Įtrauktas: {header_path}")

        except FileNotFoundError:
            print(f"  - Praleistas (nerastas): {file_path}")
        except Exception as e:
            print(f"  - KLAIDA skaitant '{file_path}': {e}")
            
    # Sujungiame viską į vieną tekstą
    final_content = "--- START OF FILE project_code_export.txt ---\n\n" + "".join(exported_blocks)
    
    # Įrašome į failą
    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(final_content)
        
        total_kb = total_size / 1024
        print("\n" + "="*50)
        print(f"✅ SĖKMINGAI EKSPORTUOTA!")
        print(f"Failas: {OUTPUT_FILE}")
        print(f"Bendra apimtis: {total_kb:.2f} KB")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ KLAIDA: Nepavyko įrašyti į '{OUTPUT_FILE}': {e}")

if __name__ == "__main__":
    export_project()