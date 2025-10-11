// story_trigger.js - Triggers story scenes
console.log("✅ story_trigger.js loaded");

window.StoryTrigger = {
  // Track which scenes have been shown
  scenesShown: {},

  // Test function for manual triggering
  test: function (character) {
    console.log("🎬 Story trigger test for:", character);

    // Show current relationship
    const score = window.GameRelationships.get(character);
    const status =
      score > 30 ? "😊 Allied" : score < -30 ? "😠 Hostile" : "😐 Neutral";

    console.log(`${character} relationship: ${score}/100 ${status}`);

    // Show alert
    alert(
      `Story scene for ${character.toUpperCase()}\n\nRelationship: ${score}/100\nStatus: ${status}\n\n(Full dialogue system coming soon!)`
    );
  },

  // Story beats - which character appears after which level
  storyBeats: {
    "1-4": "toad",
    "2-4": "luigi",
    "3-4": "peach",
    "4-4": "toad",
    "5-4": "luigi",
    "8-4": "peach",
  },

  // Check if should trigger story at this level
  checkTrigger: function (world, level) {
    const mapKey = `${world}-${level}`;

    if (this.storyBeats[mapKey] && !this.scenesShown[mapKey]) {
      const character = this.storyBeats[mapKey];
      this.scenesShown[mapKey] = true;

      console.log("📍 Story beat triggered:", character, "at", mapKey);

      // Trigger after short delay
      setTimeout(() => {
        this.triggerStory(character, mapKey);
      }, 1000);
    }
  },

  // Trigger story scene
  triggerStory: function (character, mapKey) {
    console.log("🎬 Triggering story:", character, "at", mapKey);

    // TODO: Call dialogue system when ready
    if (window.GameDialogue && window.GameDialogue.show) {
      window.GameDialogue.show(character, { map: mapKey });
    } else {
      // Fallback to test function
      this.test(character);
    }
  },
};

console.log("✅ StoryTrigger ready");
