from generate_level import MarioLevelGenerator

# Put your API key here
API_KEY = "AIzaSyAxlfwHUMQ5cxlfW2EiLpznh1QBf4BgsfY"

# Initialize the generator (now using "Maps" folder)
print("🎮 Initializing Mario Level Generator...")
generator = MarioLevelGenerator(API_KEY)  # Will automatically use "Maps" folder

# Load existing levels (for training)
print("📚 Loading existing levels from Maps folder...")
generator.load_all_maps()
print(f"✅ Loaded {len(generator.all_maps)} levels")

# Generate your first level!
print("\n🎨 Generating a new level...")
try:
    result = generator.generate_and_validate_level(
        difficulty="medium",
        theme="Overworld",
        special_features=["pipes", "coins"]
    )
    
    # Save the level (will save to Maps folder)
    filepath = generator.save_generated_level(result['code'])
    
    print(f"\n🎉 SUCCESS! Your new level is ready!")
    print(f"📁 Saved to: {filepath}")
    print(f"\n📊 Stats:")
    print(f"   - Difficulty: {result['difficulty']}")
    print(f"   - Theme: {result['theme']}")
    print(f"   - Warnings: {len(result['validation']['warnings'])}")
    if result['validation']['warnings']:
        for warning in result['validation']['warnings']:
            print(f"     ⚠️  {warning}")
    
except Exception as e:
    print(f"\n❌ Generation failed: {e}")
    print("\nTips:")
    print("- Make sure your API key is correct")
    print("- Check that Maps folder exists with World*.js files")
    print("- Try running again (sometimes it needs multiple attempts)")