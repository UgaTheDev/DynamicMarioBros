
import google.generativeai as genai
import os
import re
from typing import List, Dict, Tuple
import json
import random






class MarioLevelGenerator:
    def __init__(self, api_key: str, maps_directory: str = "Maps"):
        """
        Initialize the Mario Level Generator
        
        Args:
            api_key: Google Gemini API key
            maps_directory: Path to directory containing World*.js files
        """

        genai.configure(api_key = "AIzaSyAxlfwHUMQ5cxlfW2EiLpznh1QBf4BgsfY")

        self.model = genai.GenerativeModel(model_name='models/gemini-2.5-pro')
        self.maps_directory = maps_directory
        self.all_maps = []
        self.pattern_database = {}

        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                print(m.name)
        
    def load_all_maps(self) -> List[Tuple[str, str]]:
        """Load all World*.js files and return (filename, content) pairs"""
        map_files = []
        for filename in sorted(os.listdir(self.maps_directory)):
            if filename.startswith('World') and filename.endswith('.js'):
                filepath = os.path.join(self.maps_directory, filename)
                with open(filepath, 'r') as f:
                    content = f.read()
                    map_files.append((filename, content))
        self.all_maps = map_files
        return map_files
    
    def extract_comprehensive_patterns(self) -> Dict:
        """
        Extract comprehensive patterns from all levels for better training
        """
        if not self.all_maps:
            self.load_all_maps()
        
        patterns = {
            'themes': {},
            'common_structures': [],
            'enemy_combinations': [],
            'powerup_patterns': [],
            'difficulty_indicators': {},
            'special_mechanics': []
        }
        
        for filename, content in self.all_maps:
            # Extract themes
            themes = re.findall(r'new Area\("([^"]+)"', content)
            for theme in themes:
                patterns['themes'][theme] = patterns['themes'].get(theme, 0) + 1
            
            # Look for special mechanics
            if 'Lakitu' in content:
                patterns['special_mechanics'].append('Flying enemy (Lakitu)')
            if 'Cannon' in content:
                patterns['special_mechanics'].append('Bullet Bills')
            if 'pushPreScale' in content:
                patterns['special_mechanics'].append('Scales/Lifts')
            if 'pushPreBridge' in content:
                patterns['special_mechanics'].append('Bridges')
            if 'goUnderWater' in content:
                patterns['special_mechanics'].append('Underwater physics')
            if 'Podoboo' in content:
                patterns['special_mechanics'].append('Fire obstacles')
            if 'Platform' in content and 'move' in content:
                patterns['special_mechanics'].append('Moving platforms')
        
        self.pattern_database = patterns
        return patterns
    
    def get_training_examples_by_theme(self, theme: str, count: int = 3) -> List[str]:
        """Get example levels matching a specific theme"""
        if not self.all_maps:
            self.load_all_maps()
        
        matching = []
        for filename, content in self.all_maps:
            if f'new Area("{theme}"' in content:
                matching.append(content)
        
        # Return random sample or all if fewer than count
        return random.sample(matching, min(count, len(matching)))
    
    def create_enhanced_training_prompt(self, theme: str = "Overworld", 
                                       difficulty: str = "medium") -> str:
        """Create an enhanced training prompt with relevant examples"""
        
        # Get theme-specific examples
        examples = self.get_training_examples_by_theme(theme, 3)
        if not examples:
            examples = [content for _, content in self.all_maps[:3]]
        
        prompt = """You are an expert Super Mario Bros level designer. Generate ONLY valid JavaScript code for a new level.

## CRITICAL RULES - MUST FOLLOW EXACTLY:

1. **File Structure (EXACT ORDER):**
```javascript
map.time = 300; // Optional
map.locs = [
  new Location(0, true)
];
map.areas = [
  new Area("ThemeName", function() {
    setLocationGeneration(0);
    // level code here
  })
];
```

2. **Common Variables (use these exactly):**
   - `jumplev1` = 32 (first jump height)
   - `jumplev2` = 64 (second jump height)
   - `ceilmax` = 88 (ceiling height)

3. **Location Entry Functions:**
   - `true` - normal start
   - `walkToPipe` - walking into pipe
   - `exitPipeVert` - exiting vertical pipe
   - `startCastle` - castle entrance
   - `enterCloudWorld` - sky area

4. **Area Types (use exactly as shown):**
   - "Overworld" - standard grass level
   - "Overworld Night" - nighttime grass
   - "Overworld Alt" - fence background
   - "Underwater" - water level (need `goUnderWater();`)
   - "Castle" - bowser's castle
   - "Sky" / "Sky Night" - cloud bonus areas

## ESSENTIAL FUNCTIONS:

**Terrain:**
- `pushPreFloor(x, y, width)` - Ground tiles
- `pushPrePattern(type, x, y, repeat)` - Backgrounds
- `makeCeiling(x, width)` - Ceiling
- `makeCeilingCastle(x, width, height)` - Castle ceiling

**Structures:**
- `pushPrePipe(x, y, height, enterable, transportTo, locationIndex)`
- `pushPreTree(x, y, height)` - Trees (overworld)
- `pushPreBridge(x, y, width, [edges])` - Bridges over water
- `pushPreCastle(x, y, large)` - Castle decoration
- `endCastleOutside(x, y, large, height, baseHeight)` - Level end flag

**Blocks/Items:**
- `pushPreThing(Type, x, y, contents)` - Single block
- `fillPreThing(Type, x, y, numX, numY, xGap, yGap, contents, hidden)` - Multiple

**Block Types:** Brick, Block, Stone, Coin
**Contents:** Mushroom, Star, Coin, [Vine, locationIndex], [Mushroom, 1]

**Enemies:**
- `pushPreThing(Goomba, x, 8)` - Basic enemy
- `pushPreThing(Koopa, x, 12, flying, smart, [bounds])` - Turtle
- `pushPreThing(HammerBro, x, y)` - Hammer thrower
- `pushPreThing(Beetle, x, 8.5)` - Buzzy beetle
- `pushPreThing(Lakitu, x, 84)` - Cloud enemy
- `pushPreThing(Cannon, x, y, height, upside)` - Bullet bill
- `pushPreThing(Blooper, x, y)` - Underwater squid
- `pushPreThing(CheepCheep, x, y, red, fly)` - Fish
- `pushPreThing(Podoboo, x, -32)` - Fire bar

**Special Objects:**
- `pushPreThing(Springboard, x, 14.5)` - Bouncer
- `pushPreThing(Platform, x, y, width, movement)` - Moving platform
- `pushPreScale(x, y, width, [numLeft, numRight, height])` - See-saw

**Movement patterns:**
- `[moveSliding, leftBound, rightBound]` - Horizontal
- `[moveFloating, topBound, bottomBound]` - Vertical
- `moveFalling` - Falls when stepped on
- `collideTransport` - Takes to next location

**Zones:**
- `zoneStartCheeps(x)` / `zoneStopCheeps(x)` - Flying fish zone
- `zoneDisableLakitu()` - Stop Lakitu spawning

**Underwater:**
- `goUnderWater();` - MUST call at area start
- `pushPreThing(Coral, x, y, height)` - Seaweed decoration
- `fillPreWater(x, y, width)` - Water sections (non-underwater)

## COORDINATE SYSTEM:
- X: 0 to 2000+ (left to right)
- Y: 0 = ground, increases upward
- Standard heights: jumplev1=32, jumplev2=64, 88=max jump
- Enemy Y positions: Goomba/8, Koopa/12, Beetle/8.5
- Unit = 8 pixels

## DESIGN PRINCIPLES:

1. **Spacing:** 40-100 units between major obstacles
2. **First 128 units:** Keep easy, no enemies at spawn
3. **Power-ups:** Mushroom early, Star for hard sections  
4. **Pipes:** Every 200-400 units for visual variety
5. **Coins:** Guide players, show secret paths
6. **Difficulty curve:** Easy start, harder middle, manageable end

## LEVEL TEMPLATES BY DIFFICULTY:

**Easy (800-1200 units):**
- Few enemies (Goombas, Koopas only)
- Wide platforms, simple jumps
- Mushroom by unit 200
- 1-2 pipes
- Flat terrain mostly

**Medium (1200-1800 units):**
- Mixed enemies
- Some platforming challenges
- 2-3 power-ups
- 3-5 pipes
- Varied terrain (stairs, gaps, platforms)

**Hard (1800-2400 units):**
- Dangerous enemies (HammerBros, Lakitu)
- Complex platforming
- Limited power-ups
- Many obstacles
- Moving platforms, cannons

## EXAMPLE LEVELS:

"""
        
        # Add relevant examples
        for i, example in enumerate(examples[:3]):
            prompt += f"\n### Example {i+1}:\n```javascript\n{example}\n```\n"
        
        prompt += """

## OUTPUT FORMAT:
Generate ONLY the JavaScript code. No explanations, no markdown blocks.
Start with `map.time = X;` or `map.locs = [...]`.
Ensure all brackets and parentheses are balanced.
Use exact function names and parameters as shown.

"""
        
        return prompt
    
    def generate_level(self, difficulty: str = "medium", 
                      theme: str = "Overworld",
                      special_features: List[str] = None) -> str:
        """
        Generate a new Mario level
        
        Args:
            difficulty: "easy", "medium", "hard"
            theme: Area theme
            special_features: Optional list like ["pipes", "cannons", "underwater"]
        """
        training_prompt = self.create_enhanced_training_prompt(theme, difficulty)
        
        # Build feature requirements
        features_text = ""
        if special_features:
            features_text = f"\nInclude these features: {', '.join(special_features)}"
        
        length_map = {
            "easy": "800-1200 units",
            "medium": "1200-1800 units", 
            "hard": "1800-2500 units"
        }
        
        generation_request = f"""
{training_prompt}

## GENERATE NEW LEVEL:

**Requirements:**
- Difficulty: {difficulty}
- Theme: {theme}
- Length: {length_map[difficulty]}
- Enemy density: {difficulty}
{features_text}

Generate the complete level code NOW (code only, no explanations):
"""
        
        try:
            response = self.model.generate_content(
                generation_request,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.9,  # High creativity
                    top_p=0.95,
                )
            )
            return response.text
        except Exception as e:
            print(f"Generation error: {e}")
            return None
    
    def validate_level(self, level_code: str) -> Dict:
        """Comprehensive validation of generated level"""
        issues = []
        warnings = []
        
        # Remove any markdown formatting
        if '```' in level_code:
            level_code = re.sub(r'```javascript\s*', '', level_code)
            level_code = re.sub(r'```\s*', '', level_code)
        
        # Check basic structure
        if 'map.locs' not in level_code:
            issues.append("Missing map.locs array")
        if 'map.areas' not in level_code:
            issues.append("Missing map.areas array")
        if 'setLocationGeneration' not in level_code:
            issues.append("Missing setLocationGeneration call")
        
        # Check brackets balance
        if level_code.count('[') != level_code.count(']'):
            issues.append(f"Mismatched brackets: {level_code.count('[')} [ vs {level_code.count(']')} ]")
        if level_code.count('(') != level_code.count(')'):
            issues.append(f"Mismatched parentheses: {level_code.count('(')} ( vs {level_code.count(')')} )")
        if level_code.count('{') != level_code.count('}'):
            issues.append(f"Mismatched braces: {level_code.count('{')} {{ vs {level_code.count('}')} }}")
        
        # Check for floor
        if 'pushPreFloor' not in level_code:
            warnings.append("No floor detected - level may be unplayable")
        
        # Check for end condition
        if 'endCastle' not in level_code and 'pushPreWarpWorld' not in level_code:
            warnings.append("No clear level ending detected")
        
        # Check for background
        if 'pushPrePattern' not in level_code and 'pushPreCastle' not in level_code:
            warnings.append("No background pattern - may look empty")
        
        # Check underwater consistency
        if 'goUnderWater' in level_code:
            if 'Underwater' not in level_code:
                warnings.append("goUnderWater() called but area type not Underwater")
        
        # Check Y coordinates are reasonable
        suspicious_y = re.findall(r',\s*(\d{3,})\s*[,\)]', level_code)
        if any(int(y) > 200 for y in suspicious_y):
            warnings.append("Some Y coordinates seem too high (>200)")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'cleaned_code': level_code
        }
    
    def save_generated_level(self, level_code: str, filename: str = None):
        """Save generated level to file"""
        if filename is None:
            # Auto-generate filename
            existing = [f for f in os.listdir(self.maps_directory) 
                       if f.startswith('WorldGenerated') and f.endswith('.js')]
            num = len(existing) + 1
            filename = f"WorldGenerated{num}.js"
        
        if not filename.endswith('.js'):
            filename += '.js'
            
        filepath = os.path.join(self.maps_directory, filename)
        with open(filepath, 'w') as f:
            f.write(level_code)
        print(f"✓ Level saved to {filepath}")
        return filepath
    
    def generate_and_validate_level(self, difficulty: str = "medium", 
                                    theme: str = "Overworld",
                                    special_features: List[str] = None,
                                    max_attempts: int = 3) -> Dict:
        """
        Generate and validate a level, retry if needed
        
        Returns: Dict with level code and validation info
        """
        for attempt in range(max_attempts):
            print(f"🎮 Generation attempt {attempt + 1}/{max_attempts}...")
            
            level_code = self.generate_level(difficulty, theme, special_features)
            
            if not level_code:
                print("❌ Generation failed")
                continue
            
            # Validate
            validation = self.validate_level(level_code)
            
            print(f"📋 Validation: {len(validation['issues'])} issues, {len(validation['warnings'])} warnings")
            
            if validation['valid']:
                if validation['warnings']:
                    print("⚠️  Warnings:", ', '.join(validation['warnings']))
                print("✅ Level generated successfully!")
                return {
                    'code': validation['cleaned_code'],
                    'validation': validation,
                    'difficulty': difficulty,
                    'theme': theme
                }
            else:
                print("❌ Issues:", ', '.join(validation['issues']))
        
        raise Exception(f"Failed to generate valid level after {max_attempts} attempts")


# USAGE EXAMPLES
if __name__ == "__main__":
    # Initialize generator
    API_KEY = "your-gemini-api-key-here"
    generator = MarioLevelGenerator(API_KEY)
    
    # Load and analyze existing levels
    print("📚 Loading existing levels...")
    generator.load_all_maps()
    patterns = generator.extract_comprehensive_patterns()
    print(f"✓ Loaded {len(generator.all_maps)} levels")
    print(f"✓ Found themes: {list(patterns['themes'].keys())}")
    
    # Generate a single level
    print("\n🎨 Generating new level...")
    try:
        result = generator.generate_and_validate_level(
            difficulty="medium",
            theme="Overworld",
            special_features=["pipes", "platforms"]
        )
        
        # Save to file
        filepath = generator.save_generated_level(result['code'])
        print(f"\n🎉 Success! Level ready to play: {filepath}")
        
    except Exception as e:
        print(f"\n💥 Error: {e}")
    
    # Generate multiple levels
    print("\n🎲 Generating multiple levels...")
    configs = [
        ("easy", "Overworld", ["pipes"]),
        ("medium", "Overworld Night", ["enemies", "powerups"]),
        ("hard", "Castle", ["lava", "hammerbros"])
    ]
    
    for diff, theme, features in configs:
        try:
            print(f"\n--- {diff.upper()} {theme} ---")
            result = generator.generate_and_validate_level(diff, theme, features)
            generator.save_generated_level(result['code'])
        except Exception as e:
            print(f"Failed: {e}")