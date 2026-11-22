(() => {
  'use strict';
  // Entirely local greetings. No names, calendar access, or extra requests.
  const BANKS = {
  "early": [
    "A fresh start, at a gentle pace.",
    "The day is still stretching.",
    "Welcome to the quiet beginning.",
    "Morning is taking its first breath.",
    "A little peace before the bustle.",
    "Start softly. There is time.",
    "The early hours have their own music.",
    "A new day is finding its feet.",
    "Good things can start quietly.",
    "Welcome. The day is just opening.",
    "Let the morning come to you.",
    "A fresh page, no rush to fill it.",
    "The world is turning another page.",
    "A little stillness goes a long way.",
    "Here comes another possibility.",
    "The morning has room for wonder.",
    "Begin with a moment to breathe.",
    "Small beginnings count, too.",
    "The day has barely said hello.",
    "Ease into the hours ahead.",
    "A gentle hello to a brand-new day.",
    "Let curiosity wake up first.",
    "Every grand day starts somewhere.",
    "A quiet start can carry far.",
    "The day is open for discovery."
  ],
  "morning": [
    "Good morning. Find your rhythm.",
    "Welcome to the brighter hours.",
    "Make room for a little delight.",
    "The morning is gathering momentum.",
    "A good tune suits this hour.",
    "Hello, morning. Let's see what happens.",
    "A little optimism with the daylight.",
    "The day is finding its voice.",
    "Something good may be just ahead.",
    "Take a breath between the busy bits.",
    "Morning looks good from here.",
    "A fresh thought can change the day.",
    "Welcome. Settle into the morning.",
    "Let the good ideas wander in.",
    "There is plenty of day to explore.",
    "A small kindness makes a fine start.",
    "The morning could use your curiosity.",
    "Enjoy a moment before the next thing.",
    "Let this hour have a little sparkle.",
    "Good morning to the passing world.",
    "A little music for the road ahead.",
    "Find something worth smiling about.",
    "This morning has possibilities.",
    "Bring a little wonder along.",
    "The day is ready when you are."
  ],
  "afternoon": [
    "Welcome to the afternoon.",
    "The day has found its rhythm.",
    "A small pause can refresh the hour.",
    "There is still room for something good.",
    "Let the afternoon breathe a little.",
    "A new idea could arrive any minute.",
    "Good company for the middle hours.",
    "The afternoon has a few pages left.",
    "A little music keeps things moving.",
    "Take the scenic route through a thought.",
    "Hello again, afternoon.",
    "The next good moment may be a small one.",
    "A welcome pause in a busy world.",
    "Make a little space for delight.",
    "The day still has stories to tell.",
    "A kind word fits any afternoon.",
    "Let curiosity carry the next hour.",
    "Find a comfortable pace.",
    "There is wonder in the ordinary bits.",
    "An afternoon with room to wander.",
    "A fresh perspective is always welcome.",
    "The middle of the day deserves music.",
    "Enjoy the moment between moments.",
    "Something lovely might go unnoticed. Look.",
    "A little cheer for the hours ahead."
  ],
  "evening": [
    "Welcome to the evening.",
    "Let the evening find its own tempo.",
    "The day is changing shifts.",
    "A gentler rhythm for the hours ahead.",
    "The evening has entered the chat.",
    "Settle in. There is music to enjoy.",
    "A little calm as the day unfolds.",
    "Give the evening room to surprise you.",
    "The day is turning down its collar.",
    "Welcome to a different kind of busy.",
    "Let the small good things linger.",
    "An evening well suited to a good tune.",
    "There is still a little day to savor.",
    "Take a moment to arrive here.",
    "The evening is making itself comfortable.",
    "A softer pace might suit this hour.",
    "Let the next chapter begin gently.",
    "Good evening to everyone passing by.",
    "A pause, a breath, a little music.",
    "The day has earned a thoughtful ending.",
    "Some moments are better unhurried.",
    "Find a little warmth in the ordinary.",
    "The evening leaves room for wonder.",
    "A welcoming corner of the day.",
    "Let the bustle loosen its grip."
  ],
  "night": [
    "Good evening. Enjoy a quiet moment.",
    "The night has its own soundtrack.",
    "Let the busy thoughts settle a little.",
    "Welcome to the slower hours.",
    "A little peace belongs here.",
    "The day is folding up its map.",
    "Quiet moments can be quite something.",
    "Let a good melody keep you company.",
    "The evening is taking the long way home.",
    "A soft landing for a full day.",
    "There is no hurry in this hello.",
    "The world sounds different at this hour.",
    "A calm corner for wandering thoughts.",
    "Let the night bring a gentler rhythm.",
    "A little stillness between the stories.",
    "Good things happen at a softer volume.",
    "Welcome. Take the comfortable moment.",
    "The day is putting down its bags.",
    "Let the little joys linger longer.",
    "A fine hour for a familiar song.",
    "Tonight has room for a little wonder.",
    "The clock can keep its own pace.",
    "Even ordinary evenings deserve a tune.",
    "A quiet hello from Signally Day.",
    "The night is settling into its chair."
  ],
  "late": [
    "Welcome to the small hours.",
    "The clock is keeping quiet company.",
    "A gentle hello, whatever brings you here.",
    "The world has switched to its softer voice.",
    "A little music for the in-between hours.",
    "The next day is waiting in the wings.",
    "Quiet company for a quiet hour.",
    "Let the night move at its own pace.",
    "The small hours have big imaginations.",
    "Welcome to this peaceful little corner.",
    "Some stories belong to the late hours.",
    "A slow melody suits the moment.",
    "The night has plenty of room to think.",
    "A little calm, right where you are.",
    "Time is tiptoeing through the room.",
    "A soft soundtrack for wandering minds.",
    "The day is between chapters.",
    "A quiet moment is still a moment.",
    "Let the passing hours be gentle.",
    "A warm welcome at an unusual hour.",
    "The night is taking a thoughtful pause.",
    "There is company in a familiar tune.",
    "Even the clock seems contemplative.",
    "A little wonder for the night watch.",
    "Hello from the other side of midnight."
  ],
  "any": [
    "Welcome. A little wonder lives here.",
    "A good moment needs no grand entrance.",
    "Make room for an unexpected smile.",
    "A little music. A little breathing room.",
    "Curiosity is always welcome here.",
    "The ordinary has excellent hiding places.",
    "There is a story in almost everything.",
    "Enjoy the view, whatever it may be.",
    "Small joys deserve a little attention.",
    "A kind thought travels well.",
    "A little pause, just passing through.",
    "Welcome to this moment in the day.",
    "Let a good tune change the atmosphere.",
    "Something interesting is always nearby.",
    "Good company comes in many forms.",
    "There is beauty in the small details.",
    "A moment of calm is time well spent.",
    "Every hour could use a little kindness.",
    "Let your thoughts take a pleasant detour.",
    "A little delight goes a long way.",
    "The next favorite song is out there.",
    "Keep a little room for the unexpected.",
    "Welcome. Stay curious.",
    "A familiar tune can feel like a hello.",
    "Some days need a softer soundtrack.",
    "There is no wrong hour for a kind word.",
    "Good things do not always announce it.",
    "A small discovery is still a discovery.",
    "Find the lovely detail hiding in plain sight.",
    "This moment comes with possibilities.",
    "A little imagination improves the view.",
    "Pause here. The world will keep turning.",
    "Every melody starts with a single note.",
    "An open mind makes excellent company.",
    "Welcome to a little everyday wonder.",
    "A pleasant thought is worth keeping.",
    "A good rhythm can find you anywhere.",
    "The world has more stories than headlines.",
    "Notice something you usually walk past.",
    "A little laughter fits right in.",
    "There is room here for a fresh idea.",
    "A quiet kindness can echo for ages.",
    "Let a small good thing count.",
    "You never know where a tune might lead.",
    "Welcome, wherever the day has taken you.",
    "Some of the best moments are unplanned.",
    "The world could use your gentle side.",
    "A little joy does not need a reason.",
    "Stay for a song, or just a smile.",
    "Something wonderful may be wonderfully small."
  ],
  "surprise": [
    "Somewhere, a squirrel has a five-year plan.",
    "The clouds have declined to comment.",
    "A pigeon somewhere believes it runs this city.",
    "Today's mood has been approved by a fern.",
    "The furniture is keeping its opinions private.",
    "Somewhere, a duck is exceeding expectations.",
    "Please allow extra time for daydreaming.",
    "The invisible orchestra requests more snacks.",
    "A committee of sparrows has reached no verdict.",
    "This hour contains trace amounts of whimsy.",
    "The houseplants are quietly rooting for you.",
    "Somewhere, a raccoon has found its calling.",
    "The universe has misplaced its reading glasses.",
    "A very small parade may be in order.",
    "The imaginary jazz club is now open.",
    "There is no evidence the lamps are gossiping.",
    "A squirrel has probably forgotten why it came.",
    "The next great idea may arrive wearing slippers.",
    "The wallpaper remains professionally discreet.",
    "An invisible confetti cannon stands ready.",
    "The plot thickens. It may need stirring.",
    "A duck would like a word with management.",
    "Please keep all daydreams delightfully unusual.",
    "This moment was brought to you by coincidence.",
    "The teapot has requested a speaking role.",
    "Somewhere, a beetle is taking the scenic route.",
    "A tiny adventure has escaped its enclosure.",
    "The moon has a surprisingly good publicist.",
    "The squirrels have formed a subcommittee.",
    "Your regularly scheduled ordinary is on break.",
    "The air guitar department is accepting solos.",
    "The ceiling is maintaining a lofty perspective.",
    "A mysterious kazoo has joined the orchestra.",
    "Somewhere, a cat is reviewing the service.",
    "The dramatic pause has been extended.",
    "A cloud shaped like a potato has potential.",
    "The imaginary penguin says hello.",
    "Today's secret ingredient is mild bewilderment.",
    "A paperclip somewhere dreams of bigger things.",
    "The dust motes are rehearsing a ballet.",
    "This is a perfectly good hour for a plot twist.",
    "The spoons are not ready to discuss the forks.",
    "Somewhere, a snail is making excellent time.",
    "The background music knows something we don't.",
    "A thoughtful pigeon has entered the discussion.",
    "The jazz hands are currently off duty.",
    "An undercover goose may be among us.",
    "The cushions have voted for a longer interlude.",
    "A very important nothing is happening somewhere.",
    "The committee recommends a little silliness."
  ],
  "rain": [
    "A little rain. A little radio.",
    "The trees ordered a refill.",
    "Rain has brought its own percussion.",
    "The window has a new rhythm.",
    "A rainy view deserves a good soundtrack.",
    "The puddles are expanding their territory.",
    "The sky is watering the neighborhood.",
    "A little welcome amid the raindrops.",
    "The rain is trying its hand at jazz.",
    "Today's scenery comes with water effects."
  ],
  "snow": [
    "The snow has changed the scenery.",
    "A snowy view, a welcoming tune.",
    "The flakes are taking their time arriving.",
    "Snow is giving the trees a new wardrobe.",
    "The neighborhood has a fresh coat.",
    "A little music amid the snowfall.",
    "The sky has discovered paper confetti.",
    "Snowflakes: tiny visitors, elaborate outfits.",
    "The view is trying on winter.",
    "A warm hello for a snowy scene."
  ],
  "cloud": [
    "The clouds are holding a gathering.",
    "A cloudy sky still has character.",
    "The sky has chosen its softer colors.",
    "A little welcome beneath the cloud cover.",
    "The clouds are working on a group project.",
    "Today's sky prefers subtlety.",
    "A fine soundtrack for a cloudy view.",
    "The sky has brought extra layers.",
    "Clouds: the scenery that rearranges itself.",
    "The clouds have excellent stage presence."
  ],
  "clear": [
    "A clear sky leaves room for imagination.",
    "The sky is keeping things simple.",
    "A little clarity overhead.",
    "The clouds have stepped out for a while.",
    "The sky has cleared its schedule.",
    "Clear skies make a lovely backdrop.",
    "A welcoming tune beneath an open sky.",
    "The sky is enjoying some breathing room.",
    "The view overhead has fewer moving parts.",
    "A clear sky, an open invitation to wonder."
  ],
  "fog": [
    "The neighborhood is keeping a mystery.",
    "Today's view is a limited edition.",
    "The fog has softened the scenery.",
    "The distance is being a little shy.",
    "A welcoming tune for a misty view.",
    "The horizon has stepped backstage.",
    "The fog is practicing its disappearing act.",
    "Today's scenery includes a mystery filter.",
    "The view is speaking in a softer voice.",
    "The neighborhood has borrowed a cloud."
  ]
};
  const KEY = 'signallyDay.greetings.v1';
  const HOUR = 60 * 60 * 1000;
  const hourFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', hour: 'numeric', hourCycle: 'h23'
  });
  const target = document.getElementById('greeting');
  if (!target) return;
  const all = Object.values(BANKS).flat();
  let weather = null;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
  if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  let history = Array.isArray(saved.history)
    ? saved.history.filter(line => all.includes(line)).slice(-120) : [];
  let current = all.includes(saved.text) && Number.isFinite(saved.at)
    && saved.at <= Date.now() && Date.now() - saved.at < HOUR
    ? {text: saved.text, at: saved.at} : null;

  document.addEventListener('signallyDay:weather', event => {
    const data = event.detail;
    weather = data && data.stale !== true && Number.isInteger(data.condition_id)
      ? {id: data.condition_id, at: Date.now()} : null;
    // Weather only informs the NEXT hourly selection.
  });
  function timeGroup(hour) {
    if (hour < 5) return 'late';
    if (hour < 8) return 'early';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
  }
  function weatherGroup(now) {
    if (!weather || now - weather.at >= 20 * 60 * 1000) return null;
    const id = weather.id;
    if (id >= 300 && id < 600) return 'rain';
    if (id >= 600 && id < 700) return 'snow';
    if (id === 701 || id === 741) return 'fog';
    if (id === 800) return 'clear';
    if (id >= 801 && id <= 804) return 'cloud';
    // No playful weather lines for thunderstorms, smoke, or other hazards.
    return null;
  }
  function select(now) {
    const time = timeGroup(Number(hourFormat.format(new Date(now))));
    const conditions = weatherGroup(now);
    const roll = Math.random();
    const group = roll < 0.20 ? 'surprise' : roll < 0.40 ? 'any'
      : conditions && roll < 0.55 ? conditions : time;
    const pool = BANKS[group];
    let available = pool.filter(line => !history.includes(line));
    if (!available.length) {
      const oldest = Math.min(...pool.map(line => history.indexOf(line)));
      available = pool.filter(line => history.indexOf(line) === oldest);
    }
    const text = available[Math.floor(Math.random() * available.length)];
    history = history.filter(line => line !== text).concat(text).slice(-120);
    return {text, at: now};
  }
  function update() {
    const now = Date.now();
    if (!current || now < current.at || now - current.at >= HOUR) {
      current = select(now);
      try { localStorage.setItem(KEY, JSON.stringify({...current, history})); } catch (_) {}
    }
    if (target.textContent !== current.text) target.textContent = current.text;
  }
  update();
  setInterval(update, 15000); // Checks the clock; the MESSAGE changes only hourly.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();
