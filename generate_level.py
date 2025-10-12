import sys
import os
import random
import re


print("🎮 Mario Level Generator - Overwriting World Files")
print("="*60)


# Check dependencies
try:
   import google.generativeai as genai
except ImportError:
   print("❌ Run: pip install google-generativeai")
   sys.exit(1)


# Config
API_KEY = "AIzaSyAxlfwHUMQ5cxlfW2EiLpznh1QBf4BgsfY"
MAPS_DIR = "Maps1"


if not os.path.exists(MAPS_DIR):
   print(f"❌ {MAPS_DIR} folder not found")
   sys.exit(1)


# Get world numbers to generate (e.g., "12" "13" "14")
if len(sys.argv) > 1:
   # User specified which worlds (e.g., python generate_level.py 12 13 14)
   world_numbers = sys.argv[1:]
else:
   # Default: regenerate World12-14 (first level set)
   world_numbers = ["12", "13", "14"]


print(f"Will overwrite: {', '.join(['World' + w + '.js' for w in world_numbers])}\n")


# Setup Gemini
try:
   genai.configure(api_key=API_KEY)
   model = genai.GenerativeModel('gemini-2.0-flash-exp')
   print("✓ Gemini 2.0 Flash configured\n")
except Exception as e:
   print(f"❌ Gemini setup failed: {e}")
   sys.exit(1)


# Load MULTIPLE examples for variety
print("Loading example maps...")
examples = {}


# Map actual files from your Maps folder to themes
example_files = {
   'Overworld': ['World13.js', 'World53.js', 'World23.js', 'World73.js'],
   'Castle': ['World24.js', 'World54.js', 'World64.js', 'World74.js', 'World34.js'],
   'Underwater': ['World22.js', 'World72.js'],
   'Overworld Night': ['World61.js', 'World33.js', 'World32.js', 'World31.js']
}


# Load one example for each theme
for theme, filenames in example_files.items():
   for filename in filenames:
       filepath = os.path.join(MAPS_DIR, filename)
       if os.path.exists(filepath):
           with open(filepath, 'r') as f:
               examples[theme] = f.read()
               print(f"✓ Loaded {filename} ({theme})")
               break


if not examples:
   print("❌ No example files found")
   sys.exit(1)


print()


# Determine themes based on world numbers
def get_theme_for_world(world_num):
   """Determine theme based on world number pattern"""
   last_digit = int(world_num) % 10
   
   if last_digit == 1:
       return random.choice(['Overworld', 'Overworld Night'])
   elif last_digit == 2:
       return random.choice(['Underwater', 'Overworld'])
   elif last_digit == 3:
       return random.choice(['Overworld', 'Overworld Night'])
   elif last_digit == 4:
       return 'Castle'
   else:
       return random.choice(list(examples.keys()))


def generate_level(attempt, theme):
   """Generate one level of specific theme"""
  
   # Use the example for this theme
   example_code = examples.get(theme, list(examples.values())[0])
   theme_name = theme
  
   prompt = f"""Generate a NEW Super Mario {theme_name} level based on this working example:


```javascript
{example_code}
```


CREATE A SIMILAR {theme_name.upper()} LEVEL with these changes:
1. Change ALL X coordinates by +/- {random.randint(50, 200)} pixels
2. Use different enemy combinations appropriate for {theme_name}
3. Change structure heights and block positions
4. Add {random.randint(5, 15)} more enemies
5. Add {random.randint(3, 8)} more coin groups
6. Make level {random.randint(1200, 1800)} pixels long


THEME-SPECIFIC REQUIREMENTS:
- Overworld: Use pushPreTree, Goomba, Koopa, pipes
- Castle: Use startCastleInside(), Podoboo, Beetle, makeCeilingCastle()
- Underwater: Use goUnderWater(), Blooper, CheepCheep, Coral
- Sky: Use Platform with movement, Koopa (flying)


KEEP THIS EXACT STRUCTURE:
- Start: map.time, map.locs, map.areas
- Use: new Area("{theme_name}", function() {{
- First floor: pushPreFloor(0, 0, X) where X >= 60
- End: endCastleOutside(...) or endCastleInside(...)
- Use same function names as example


Output ONLY JavaScript code, NO explanations or markdown:"""
  
   try:
       response = model.generate_content(
           prompt,
           generation_config=genai.types.GenerationConfig(
               temperature=0.9,
               top_p=0.95,
           )
       )
       return response.text
   except Exception as e:
       print(f"    ❌ API error: {e}")
       return None


def clean_code(code):
   """Clean up generated code and GUARANTEE spawn floor coverage"""
   if not code:
       return None
  
   # Remove markdown
   code = re.sub(r'```javascript\s*', '', code)
   code = re.sub(r'```\s*', '', code)
   code = code.strip()
  
   # Must start with map
   if not code.startswith('map.'):
       lines = code.split('\n')
       for i, line in enumerate(lines):
           if 'map.' in line:
               code = '\n'.join(lines[i:])
               break
  
   # 🚨 SIMPLE BRUTE FORCE FIX: Just ensure first pushPreFloor is correct
   lines = code.split('\n')
  
   # Find the VERY FIRST pushPreFloor command
   first_floor_line_index = -1
   for i, line in enumerate(lines):
       if 'pushPreFloor' in line:
           first_floor_line_index = i
           break
  
   if first_floor_line_index >= 0:
       line = lines[first_floor_line_index]
       match = re.search(r'pushPreFloor\((\d+),\s*(\d+),\s*(\d+)\)', line)
      
       if match:
           x, y, w = int(match.group(1)), int(match.group(2)), int(match.group(3))
          
           # If first floor is wrong, FORCE fix it
           if x != 0 or y != 0 or w < 200:
               print(f"    🔧 Forcing spawn floor fix: ({x},{y},{w}) → (0,0,200)")
               lines[first_floor_line_index] = line.replace(
                   f'pushPreFloor({x}, {y}, {w})',
                   'pushPreFloor(0, 0, 200)'
               )
   else:
       # NO FLOOR AT ALL - insert one right after setLocationGeneration
       print("    🔧 NO FLOOR FOUND - inserting spawn floor")
       for i, line in enumerate(lines):
           if 'setLocationGeneration' in line:
               lines.insert(i + 1, "    ")
               lines.insert(i + 2, "    pushPreFloor(0, 0, 200);")
               lines.insert(i + 3, "    ")
               break
  
   return '\n'.join(lines)


def validate(code):
   """Simple validation focusing on spawn floor"""
   if not code:
       return False, "Empty code"
  
   if 'map.locs' not in code:
       return False, "Missing map.locs"
  
   if 'map.areas' not in code:
       return False, "Missing map.areas"
  
   if 'endCastle' not in code:
       return False, "Missing ending"
  
   # Find FIRST floor
   floor_match = re.search(r'pushPreFloor\((\d+),\s*(\d+),\s*(\d+)\)', code)
  
   if not floor_match:
       return False, "No floor found"
  
   x = int(floor_match.group(1))
   y = int(floor_match.group(2))
   w = int(floor_match.group(3))
  
   # STRICT CHECK: First floor must be at (0,0) with width >= 150
   if x != 0:
       return False, f"First floor at x={x}, must be 0"
  
   if y != 0:
       return False, f"First floor at y={y}, must be 0"
  
   if w < 150:
       return False, f"First floor width={w}, need 150+"
  
   # Check for some content
   enemies = len(re.findall(r'Goomba|Koopa|Beetle', code))
   if enemies < 2:
       return False, f"Only {enemies} enemies"
  
   return True, f"✓ Spawn at (0,0,{w}), {enemies} enemies"


def save_level(code, world_number):
   """Save to specific World file"""
   filename = f"World{world_number}.js"
   filepath = os.path.join(MAPS_DIR, filename)
  
   # Check if file exists
   exists = os.path.exists(filepath)
  
   with open(filepath, 'w') as f:
       f.write(code)
  
   action = "OVERWRITTEN" if exists else "CREATED"
   return filename, action


# Generate levels
print(f"{'='*60}\n")
success_count = 0
overwrite_count = 0
create_count = 0


for world_num in world_numbers:
   # Determine theme for this world number
   theme = get_theme_for_world(world_num)
   
   print(f"World{world_num}.js ({theme}):")
  
   level_saved = False
  
   for attempt in range(1, 4):
       print(f"  Attempt {attempt}...", end=" ", flush=True)
      
       # Generate with specific theme
       code = generate_level(attempt, theme)
      
       if not code:
           print("failed")
           continue
      
       # Clean - FORCE correct spawn floor
       code = clean_code(code)
      
       # Validate - STRICT spawn check
       is_valid, message = validate(code)
      
       if not is_valid:
           print(f"❌ {message}")
           continue
      
       # Save - OVERWRITE specific World file
       filename, action = save_level(code, world_num)
       print(f"✅ {filename} [{action}] ({message})")
      
       success_count += 1
       if action == "OVERWRITTEN":
           overwrite_count += 1
       else:
           create_count += 1
       level_saved = True
       break
  
   if not level_saved:
       print(f"  ❌ Failed after 3 attempts")
  
   print()


print(f"{'='*60}")
print(f"RESULTS: {success_count}/{len(world_numbers)} successful")
print(f"  📝 Overwritten: {overwrite_count} files")
print(f"  ✨ Created new: {create_count} files")
print(f"Saved in: {MAPS_DIR}/World*.js")
print(f"{'='*60}")
