# -*- coding: utf-8 -*-
import os

# -----------------------------------------------------------------------------
#                   AI PROGRAMUOTOJO INSTRUKCIJOS
# -----------------------------------------------------------------------------
#
# Sveikas, programuotojau (AI)!
#
# Šis skriptas skirtas TIK TAU.
#
# TAVO UŽDUOTIS:
#
# 1. Atlik visas tau pavestas programavimo užduotis.
# 2. PRIEŠ pranešdamas, kad baigei darbą, atidaryk šį failą
#    (`AI_CODE_CHANGES_EXPORT.py`).
# 3. Į `FILES_TO_EXPORT` sąrašą, esantį žemiau, įtrauk VISUS
#    failus, kuriuos tu redagavai arba sukūrei šios užduoties metu.
#    Naudok santykinius kelius nuo pagrindinio projekto aplanko.
#
# TAI YRA KRITIŠKAI SVARBU, kad projekto architektas galėtų greitai
# peržiūrėti tavo konkrečius pakeitimus.
#
# PAVYZDYS:
# Jei redagavai `core/job_controller.py` ir `gui/app.py`, sąrašas
# turėtų atrodyti taip:
#
# FILES_TO_EXPORT = [
#     "core/job_controller.py",
#     "gui/app.py",
# ]
#
# -----------------------------------------------------------------------------

# --- KONFIGŪRACIJA (REDAGUOK ŠĮ SĄRAŠĄ) ---
FILES_TO_EXPORT = [
    # Video creation logic centralization (Phase 1)
    "core/processors/video_finalization_processor.py",
    "core/job_controller.py",

    # Audio effects integration (Phase 2)
    "gui/components/audio_tuner_frame.py",
    "gui/components/cover_sidebar_frame.py",
    "services/audio_player.py",
    "core/audio_processor.py",

    # Template management integration (Phase 3.1)
    "core/template_manager.py",
    "gui/app.py",
    "channels.json",

    # Template files for channels
    "templates/prompts/synthwave_thematic.txt",
    "templates/prompts/synthwave_secondary.txt",
    "templates/prompts/synthwave_dynamic_image.txt",
    "templates/prompts/adict_thematic.txt",

    # Recent UI enhancements (Template dropdowns + Double-click editing)
    "gui/views/channel_settings_view.py",    # TemplateManager passing
    "gui/components/channel_editor_window.py", # Template dropdowns integration
    "gui/views/content_plan_view.py",        # Double-click theme editing

    # Phase 5: Mix Studio Backend and GUI Implementation
    "data/database_manager.py",  # Database schema updates (used_in_mix, duration_seconds, mix_jobs table) and new mix methods
    "core/processors/video_finalization_processor.py",  # Duration tracking and ffprobe integration
    "core/job_controller.py",  # Manual mix creation method with background processing
    "gui/views/mix_studio_view.py",  # Complete Mix Studio GUI with track selection, statistics, and mix creation
    "gui/app.py",  # Mix Studio tab integration and proper initialization

    # Phase 6: Enhanced Error Recovery and Resource Management
    "core/config.py",  # Made VIDEO_PROCESSOR_MAX_WORKERS configurable from environment
    "gui/components/settings_view.py",  # Added ffmpeg process control slider to GUI settings
    "core/job_controller.py",  # Enhanced retry mechanism and mix job status tracking
    "gui/views/mix_studio_view.py",  # Added mix jobs monitoring table with periodic updates

    # Phase 7: SMM Boost Functionality and UX Improvements
    "core/processors/smm_processor.py",  # NEW FILE - SMMProcessor class for boost operations
    "core/job_controller.py",  # MODIFIED - Added start_smm_boost method for background SMM processing
    "gui/app.py",  # MODIFIED - Updated SMM tab with package selection and backend integration

    # Phase 8: Final UX Improvements and Code Cleanup
    "gui/app.py",  # MODIFIED - SMM panel: video_id handling for READY_FOR_UPLOAD videos, Checkbox state 'disabled' for non-boostable videos
    "gui/components/channel_editor_window.py",  # MODIFIED - Thumbnail editor: messagebox when no image found, save confirmation dialog

    # Phase 8.1: Architecture Cleanup - Processor Error Handling
    "core/job_controller.py",  # MODIFIED - Removed job_controller from processor init, decentralized error handling in processors
    "core/processors/video_finalization_processor.py",  # MODIFIED - Removed job_controller dependency, error handling moved to process methods
    "core/processors/image_generation_processor.py",  # MODIFIED - Process method try/except around for loop, internal methods raise Exception
    "core/processors/thumbnail_generation_processor.py",  # MODIFIED - Process method try/except around for loop, internal methods raise Exception

    # Phase 8.2: Resilience Enhancement - Main Loop Error Handling
    "core/job_controller.py",  # MODIFIED - Added individual try/except blocks around each processor.process() call in main_loop method with specific error logging

    # Phase 9.1: Auto-Commentator Backend Completion
    "data/database_manager.py",  # MODIFIED - Added comment_status to videos table creation, updated get_videos_for_commenting with channel filtering
    "core/processors/comment_processor.py",  # MODIFIED - Renamed process_comments to process, implemented flexible multi-line template system with random selection
    "core/job_controller.py",  # MODIFIED - Updated call from process_comments() to process() in main_loop
    "templates/prompts/example_comments.txt",  # NEW FILE - Example comment templates for GUI preparation

    # Phase 9.2: Dependency Injection Fixes for JobController Processors
    "core/job_controller.py",  # MODIFIED - Fixed processor initializations to pass missing dependencies (video_processing_pool, template_manager, notification_manager)
    "core/processors/image_generation_processor.py",  # MODIFIED - Added template_manager and notification_manager parameters to __init__
    "core/processors/thumbnail_generation_processor.py",  # MODIFIED - Added notification_manager parameter to __init__
    "core/processors/video_finalization_processor.py",  # MODIFIED - Added template_manager parameter to __init__
    "core/processors/comment_processor.py",  # MODIFIED - Added notification_manager parameter to __init__

    # Phase 9.3: JobController __init__ Method Reorganization
    "core/job_controller.py",  # MODIFIED - Reorganized __init__ method into logical sections with numbered comments for clarity
    "core/processors/video_finalization_processor.py",  # MODIFIED - Added notification_manager=None parameter to __init__ method

    # Phase 9.4: MixStudioView Runtime Error Fix and Treeview Standardization
    "gui/views/mix_studio_view.py",  # MODIFIED - Moved _load_channel_list() from __init__ to initialize_data() method, updated Treeview to use column IDs
    "gui/app.py",  # MODIFIED - Added initialize_data() call after mix_studio_view creation to prevent initialization errors

    # Phase 9.5: Comment Studio GUI Creation and Integration
    "gui/views/comment_studio_view.py",  # NEW FILE - Complete CommentStudioView class for managing comment templates and monitoring status
    "data/database_manager.py",  # MODIFIED - Added get_all_videos_with_comment_status() method for comment monitoring
    "gui/app.py",  # MODIFIED - Added "💬 Komentarų Studija" tab and CommentStudioView integration

    # Phase 9.6: Interactive Comment Studio with Manual Posting
    "core/job_controller.py",  # MODIFIED - Added post_single_comment_manually() public method for manual comment posting with threading
    "data/database_manager.py",  # MODIFIED - Updated get_all_videos_with_comment_status() to accept status_filter parameter
    "gui/views/comment_studio_view.py",  # MODIFIED - Enhanced with CTkTabview tabs ("Laukiantys" and "Publikuoti"), checkbox selection, and manual posting functionality; Fixed _assign_template() to use correct ConfigManager.update_channel() method

    # Phase 10: Intelligent SMM Boost with Custom Comments
    "smm_packages.json",  # MODIFIED - Updated default_boost package to include comments section and type field
    "templates/prompts/smm_custom_comments.txt",  # NEW FILE - SMM comment generation prompt template
    "services/smm_client.py",  # MODIFIED - Updated add_order() method to accept optional comments parameter
    "services/gemini_client.py",  # MODIFIED - Added generate_smm_comments() method for SMM comment generation
    "core/processors/smm_processor.py",  # MODIFIED - Enhanced process_boost_requests() to handle comment generation and pass comments to API
    "core/job_controller.py",  # MODIFIED - Updated start_smm_boost() to pass db_manager, gemini_client, and template_manager to SMMProcessor

    # Phase 11: Final Bug Fixes - JobController dependency passing errors Part 2
    "core/job_controller.py",  # MODIFIED - Updated JobController __init__ to properly pass video_processing_pool, template_manager, and notification_manager to processors
    "core/processors/image_generation_processor.py",  # MODIFIED - Added video_processing_pool, template_manager, and notification_manager parameters to __init__ and stored them as instance variables
    "core/processors/thumbnail_generation_processor.py",  # MODIFIED - Added notification_manager parameter to __init__ and stored as instance variable
    "core/processors/comment_processor.py",  # MODIFIED - Added template_manager and notification_manager parameters to __init__ and stored as instance variables
    "core/processors/video_finalization_processor.py",  # MODIFIED - Added notification_manager parameter to __init__ and stored as instance variable
    "gui/views/mix_studio_view.py",  # MODIFIED - Moved _load_channel_list() call from __init__ to initialize_data() method, updated Treeview configuration to use column IDs
    "gui/app.py",  # MODIFIED - Added initialize_data() call after mix_studio_view creation, updated gui/views/comment_studio_view.py integration if applicable

    # Phase 12: Critical Runtime Error Fixes
    "core/job_controller.py",  # MODIFIED - Fixed NameError: name 'job' is not defined in _process_retry_cover_generation method by adding missing for loop line
    "data/database_manager.py",  # MODIFIED - Fixed KeyError: 'channel_id' in CommentProcessor by adding gr.channel_id to SELECT query in get_videos_for_commenting method
    "core/processors/video_finalization_processor.py",  # MODIFIED - Fixed PermissionError: [WinError 32] by wrapping os.rename() calls with try/except blocks in both _create_video_thread and process_old methods
]

# Išvesties failo pavadinimas
OUTPUT_FILE = "ai_code_changes.txt"

# --- SKRIPTO LOGIKA (NEREDAGUOK ŽEMIAU ESANČIO KODO) ---

def export_changed_files():
    """
    Surenka nurodytų failų turinį ir išsaugo jį į vieną .txt failą.
    """
    print("🚀 Pradedamas AI pakeistų failų eksportavimas...")

    if not FILES_TO_EXPORT:
        print("🟡 ĮSPĖJIMAS: `FILES_TO_EXPORT` sąrašas yra tuščias. Nebus sugeneruotas joks failas.")
        return

    exported_blocks = []
    
    for file_path in FILES_TO_EXPORT:
        # Naudojame forward slashes, kad būtų universalu
        header_path = file_path.replace(os.sep, '/')
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            block = f"=== {header_path} ===\n{content}\n\n"
            exported_blocks.append(block)
            print(f"  + Įtrauktas pakeitimas: {header_path}")

        except FileNotFoundError:
            print(f"  - KLAIDA: Failas nerastas ir praleistas: {header_path}")
        except Exception as e:
            print(f"  - KLAIDA skaitant '{header_path}': {e}")

    # Sujungiame viską į vieną tekstą
    final_content = "--- START OF AI CODE CHANGES EXPORT ---\n\n" + "".join(exported_blocks)
    
    # Įrašome į failą
    try:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(final_content)
        
        print("\n" + "="*50)
        print(f"✅ AI PAKEITIMAI SĖKMINGAI EKSPORTUOTI!")
        print(f"Failas: {OUTPUT_FILE}")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ KLAIDA: Nepavyko įrašyti į '{OUTPUT_FILE}': {e}")

if __name__ == "__main__":
    export_changed_files()
