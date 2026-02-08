#!/usr/bin/env python3
"""
Web Deployment Script for Kryssord Generator

This script prepares the crossword puzzles for web deployment by:
1. Converting generated puzzles to web-compatible format
2. Updating the puzzle list
3. Copying files to web directory
"""

import json
import shutil
from pathlib import Path
import argparse


def copy_puzzle_to_web(puzzle_file, web_dir):
    """Copy a puzzle file to the puzzles directory under the web root."""
    
    web_puzzles_dir = web_dir / "puzzles"
    web_puzzles_dir.mkdir(exist_ok=True)
    
    puzzle_path = Path(puzzle_file)
    if not puzzle_path.exists():
        print(f"❌ Puzzle file not found: {puzzle_file}")
        return False
    
    # Copy to web directory
    dest_path = web_puzzles_dir / puzzle_path.name
    # If the source is already in the target directory, skip copying
    try:
        if puzzle_path.resolve() == dest_path.resolve():
            print(f"ℹ️ Puzzle already in web directory: {puzzle_path.name}")
            return True
    except OSError:
        # If resolution fails for any reason, fall back to normal copy
        pass

    shutil.copy2(puzzle_path, dest_path)
    
    print(f"✅ Copied {puzzle_path.name} to web directory")
    return True


def update_puzzle_list(web_dir):
    """Update the available puzzles list for the web interface."""
    
    web_puzzles_dir = web_dir / "puzzles"
    if not web_puzzles_dir.exists():
        print("❌ Puzzles directory doesn't exist")
        return
    
    puzzles = []
    
    # Scan for JSON files
    for puzzle_file in web_puzzles_dir.glob("*.json"):
        try:
            with open(puzzle_file, 'r', encoding='utf-8') as f:
                puzzle_data = json.load(f)
            
            # Extract metadata for display
            metadata = puzzle_data.get('metadata', {})
            title = metadata.get('title', puzzle_file.stem)
            difficulty = metadata.get('difficulty', 'Unknown')
            date = metadata.get('generation_date', '')
            
            # Create display name
            if date:
                date_part = date.split(' ')[0] if ' ' in date else date
                display_name = f"{title} - {difficulty} ({date_part})"
            else:
                display_name = f"{title} - {difficulty}"
            
            puzzles.append({
                'file': puzzle_file.name,
                'name': display_name,
                'difficulty': difficulty,
                'title': title
            })
            
        except Exception as e:
            print(f"⚠️ Could not read puzzle {puzzle_file.name}: {e}")
    
    # Sort by difficulty and date
    difficulty_order = {'Easy': 1, 'Medium': 2, 'Hard': 3}
    puzzles.sort(key=lambda p: (difficulty_order.get(p['difficulty'], 4), p['name']))
    
    print(f"📋 Found {len(puzzles)} puzzles for web deployment:")
    for puzzle in puzzles:
        print(f"   • {puzzle['name']}")
    
    return puzzles


def deploy_to_web(source_files, web_dir, update_js=True):
    """Deploy puzzles to web directory."""
    
    web_dir = Path(web_dir)
    web_dir.mkdir(exist_ok=True)
    
    copied_count = 0
    
    # Copy each puzzle file
    for source_file in source_files:
        if copy_puzzle_to_web(source_file, web_dir):
            copied_count += 1
    
    # Update puzzle list
    puzzles = update_puzzle_list(web_dir)
    
    # Optionally update JavaScript with puzzle list
    if update_js and puzzles:
        update_js_puzzle_list(web_dir, puzzles)
    
    print(f"\n🚀 Web deployment complete!")
    print(f"   📁 {copied_count} puzzles copied")
    print(f"   🌐 Ready for GitHub Pages deployment")
    
    return copied_count > 0


def update_js_puzzle_list(web_dir, puzzles):
    """Update the JavaScript file with the current puzzle list."""
    
    js_file = web_dir / "js" / "crossword.js"
    if not js_file.exists():
        print("⚠️ JavaScript file not found, skipping JS update")
        return
    
    try:
        with open(js_file, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Create puzzle list JavaScript
        puzzle_list_js = "const puzzles = " + json.dumps(puzzles, indent=12) + ";"
        
        # Replace the hardcoded puzzle list
        import re
        pattern = r'const puzzles = \[.*?\];'
        if re.search(pattern, js_content, re.DOTALL):
            js_content = re.sub(pattern, puzzle_list_js, js_content, flags=re.DOTALL)
        else:
            # If pattern not found, try alternative pattern
            pattern = r'// In a real implementation.*?;'
            replacement = f"""// Auto-generated puzzle list
            {puzzle_list_js}"""
            js_content = re.sub(pattern, replacement, js_content, flags=re.DOTALL)
        
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print("✅ Updated JavaScript with current puzzle list")
        
    except Exception as e:
        print(f"⚠️ Could not update JavaScript: {e}")


def main():
    """Main CLI interface."""
    
    parser = argparse.ArgumentParser(description="Deploy crossword puzzles to web interface")
    parser.add_argument(
        "puzzles",
        nargs="*",
        help=(
            "Puzzle files to deploy (default: all JSON puzzles in "
            "puzzles/ and output/ when not provided)"
        ),
    )
    parser.add_argument("--web-dir", default=".", help="Web root directory path (default: current directory)")
    parser.add_argument("--no-js-update", action="store_true", help="Skip JavaScript update")
    parser.add_argument("--examples", action="store_true", help="Include example puzzles")
    
    args = parser.parse_args()
    
    # Determine source files
    if args.puzzles:
        source_files = args.puzzles
    else:
        # Auto-discover puzzles
        source_files = []

        # Primary default: puzzles already located in the web puzzles directory
        web_puzzles_dir = Path(args.web_dir) / "puzzles"
        if web_puzzles_dir.exists():
            source_files.extend(web_puzzles_dir.glob("*.json"))

        # Also include legacy output directory puzzles for convenience
        output_dir = Path("output")
        if output_dir.exists():
            source_files.extend(output_dir.glob("*.json"))

        # Add examples if requested
        if args.examples:
            examples_dir = Path("examples")
            if examples_dir.exists():
                source_files.extend(examples_dir.glob("*.json"))
    
    if not source_files:
        print("❌ No puzzle files found to deploy")
        print("💡 Generate some puzzles first with: python kryssord.py")
        return
    
    # Deploy to web
    success = deploy_to_web(
        source_files, 
        args.web_dir, 
        update_js=not args.no_js_update
    )
    
    if success:
        print(f"\n📖 To test locally:")
        print(f"   1. Open {args.web_dir}/index.html in a browser")
        print(f"   2. Or use: python -m http.server 8000 (in {args.web_dir} directory)")
        print(f"   3. Then visit: http://localhost:8000")
        
        print(f"\n🌐 For GitHub Pages:")
        print(f"   1. Commit and push the {args.web_dir}/ directory")
        print(f"   2. Enable GitHub Pages in repository settings")
        print(f"   3. Set source to main branch /{args.web_dir} folder")


if __name__ == "__main__":
    main()