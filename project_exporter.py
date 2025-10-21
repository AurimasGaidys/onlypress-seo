import os
import sys

# --- KONFIGŪRACIJA ---

# Failas, į kurį bus eksportuojamas visas projekto kodas
OUTPUT_FILE = "project_context_export.txt"

# Aplankai, kurie bus visiškai ignoruojami (ir jų turinys)
# Tai efektyviausias būdas praleisti nereikalingus failus.
EXCLUDE_DIRS = {
    "__pycache__",
    ".vscode",
    ".idea",
    ".git",
    ".next",          # Next.js build aplankas
    "node_modules",   # JavaScript priklausomybės
    "public",         # Statiniai failai (paveikslėliai, šriftai)
    "auth",           # Autentifikacijos .pickle failai
    "data",           # Duomenų bazė, cache, quotas ir t.t.
    "output",         # Sugeneruoti video, paveikslėliai
    "logs",           # Programos žurnalai
}

# Konkretūs failai, kuriuos reikia praleisti (nepriklausomai nuo jų tipo)
EXCLUDE_FILES = {
    "project_exporter.py",      # Pats šis skriptas (official name)
    "project_context_export.txt", # Išvesties failas
    "package-lock.json",        # Nereikalingas kontekstui
    ".gitignore",
    "tsconfig.tsbuildinfo",
    "00 start.txt"

    # Pridėkite kitus specifinius failus, kurių nereikia analizei
}

# Failų tipai (plėtiniai), kuriuos BŪTINA įtraukti į eksportą.
# Tai pagrindinis būdas apibrėžti, kas yra projekto dalis.
INCLUDE_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".css",
    ".mjs",
    ".html",
    ".txt",   # Įtraukiame .txt dėl requirements.txt ir konfigūracijų
    ".d.ts",  # TypeScript apibrėžimų failai
}

# --- SKRIPTO LOGIKA (toliau redaguoti nerekomenduojama) ---

def find_project_files(root_dir):
    """
    Randa visus projekto logikai svarbius failus pagal INCLUDE_EXTENSIONS,
    taikydamas EXCLUDE_DIRS ir EXCLUDE_FILES taisykles.
    """
    project_files = []
    
    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        # Efektyvus būdas praleisti nereikalingus aplankus
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            # Tikriname, ar failo nereikia praleisti
            if filename in EXCLUDE_FILES:
                continue

            # Tikriname, ar failo plėtinys yra įtraukiamųjų sąraše
            file_ext = os.path.splitext(filename)[1].lower()
            if file_ext in INCLUDE_EXTENSIONS:
                full_path = os.path.join(dirpath, filename)
                project_files.append(os.path.relpath(full_path, root_dir))
            
    return sorted(project_files)

def export_project():
    """
    Pagrindinė funkcija, kuri surenka failų turinį ir įrašo jį į vieną failą.
    """
    print("🚀 Pradedamas projekto konteksto eksportavimas...")
    
    # Nustatome projekto šakninį aplanką (kur yra šis skriptas)
    root_dir = os.path.dirname(os.path.abspath(__file__))
    files_to_export = find_project_files(root_dir)
    
    exported_blocks = []
    total_size = 0
    
    print(f"✅ Rasta {len(files_to_export)} svarbių failų eksportavimui.")

    for file_path in files_to_export:
        try:
            # Naudojame universalius pasviruosius brūkšnius (/) keliams
            header_path = file_path.replace(os.sep, '/')
            
            with open(os.path.join(root_dir, file_path), "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            block = f"--- START OF FILE {header_path} ---\n{content}\n--- END OF FILE {header_path} ---\n\n"
            exported_blocks.append(block)
            total_size += len(block.encode('utf-8'))
            
            print(f"  + Įtrauktas: {header_path}")

        except FileNotFoundError:
            print(f"  - PRALEISTAS (nerastas): {file_path}")
        except Exception as e:
            print(f"  - KLAIDA skaitant '{file_path}': {e}")
            
    # Sujungiame viską į vieną tekstą
    final_content = "".join(exported_blocks)
    output_path = os.path.join(root_dir, OUTPUT_FILE)
    
    # Įrašome į failą
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(final_content)
        
        total_kb = total_size / 1024
        print("\n" + "="*50)
        print(f"✅ PROJEKTAS SĖKMINGAI EKSPORTUOTAS!")
        print(f"Failas: {OUTPUT_FILE}")
        print(f"Bendra apimtis: {total_kb:.2f} KB")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ KLAIDA: Nepavyko įrašyti į '{OUTPUT_FILE}': {e}")

if __name__ == "__main__":
    export_project()
