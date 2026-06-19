INSERT INTO characters (name, series, version, image_url, description, categories, approved) VALUES

-- Dragon Ball
(
  'Goku',
  'Dragon Ball Z',
  'Super Saiyan Blue',
  'https://static.wikia.nocookie.net/dragonball/images/b/ba/Goku_anime_profile.png',
  'Son Goku (孫悟空 Son Gokū), born Kakarot (カカロット Kakarotto), is a Saiyan raised on Earth and the main protagonist of the Dragon Ball series.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Vegeta',
  'Dragon Ball Z',
  'Super Saiyan Blue',
  'https://static.wikia.nocookie.net/dragonball/images/9/94/Vegeta_anime_profile.png',
  'Vegeta (ベジータ Bejīta), more specifically Vegeta IV (ベジータ四世 Bejīta Yonsei),[1] recognized as Prince Vegeta (ベジータ王子 Bejīta Ōji), is the prince of the fallen Saiyan race.',
  ARRAY['strength','speed','power','combat','durability']::battle_category[],
  true
),
(
  'Frieza',
  'Dragon Ball Z',
  'Golden',
  'https://static.wikia.nocookie.net/dragonball/images/e/ee/DBS_Broly_Frieza_Render.png',
  'Frieza (フリーザ Furīza, lit. "Freeza") is a major antagonist in the Dragon Ball franchise.',
  ARRAY['strength','speed','power','durability','overall']::battle_category[],
  true
),

-- Naruto
(
  'Naruto Uzumaki',
  'Naruto',
  'Baryon Mode',
  'https://static.wikia.nocookie.net/naruto/images/1/17/Naruto%27s_Baryon_Mode.png',
  'Baryon Mode (重粒子モード, Barion Mōdo) is a unique transformation accessible to Kurama with its jinchūriki.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Sasuke Uchiha',
  'Naruto',
  'Rinnegan',
  'https://static.wikia.nocookie.net/naruto-ultimate-ninja-storm/images/6/60/Sasuke_Rinnesharingan.png',
  'Sasuke Uchiha (うちはサスケ, Uchiha Sasuke) is one of the last surviving members of Konohagakure`s Uchiha clan and a reincarnation of Indra Ōtsutsuki.',
  ARRAY['intelligence','speed','power','combat','overall']::battle_category[],
  true
),
(
  'Itachi Uchiha',
  'Naruto',
  'Adult',
  'https://static.wikia.nocookie.net/naruto/images/b/bb/Itachi.png',
  'Itachi Uchiha (うちはイタチ, Uchiha Itachi) was a shinobi of Konohagakure`s Uchiha clan who served as an Anbu Captain.',
  ARRAY['intelligence','speed','power','combat']::battle_category[],
  true
),

-- One Piece
(
  'Monkey D. Luffy',
  'One Piece',
  'Gear 5 / Sun God Nika',
  'https://static.wikia.nocookie.net/onepiece/images/6/66/Gear_5_Infobox.png',
  'Gear 5 ("Gear Fifth") is the awakened form of the Hito Hito no Mi, Model: Nika, which strengthens the user`s rubbery body.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Roronoa Zoro',
  'One Piece',
  'Wano',
  'https://static.wikia.nocookie.net/glad-you-came/images/a/a2/Zoro.png',
  'Roronoa Zoro, also known as "Pirate Hunter" Zoro, is the master swordsman (剣豪, kengō?) and combatant of the Straw Hat Pirates.',
  ARRAY['strength','speed','power','combat','durability']::battle_category[],
  true
),
(
  'Shanks',
  'One Piece',
  'Present day',
  'https://static.wikia.nocookie.net/onepiece/images/6/66/Shanks_Anime_Infobox.png',
  'Red-Haired" Shanks, commonly known as just "Red Hair", is the chief of the Red Hair Pirates[2] and one of the Four Emperors that rule over the New World.',
  ARRAY['strength','power','combat','durability','overall']::battle_category[],
  true
),

-- One Punch Man
(
  'Saitama',
  'One Punch Man',
  'Present day',
  'https://static.wikia.nocookie.net/onepunchman/images/8/81/Saitama_Anime_Profile.png',
  'Saitama (サイタマ, Saitama) is the main protagonist of the series and the titular One-Punch Man.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Garou',
  'One Punch Man',
  'Cosmic Form',
  'https://static.wikia.nocookie.net/onepunchman/images/5/5c/Volume_33_Back_Cover.png',
  'Garou (ガロウ, Garō; Viz: Garo) is a martial arts prodigy and the former self-proclaimed "Hero Hunter" (ヒーロー狩り, Hīrō Gari).',
  ARRAY['strength','speed','power','combat','durability']::battle_category[],
  true
),

-- Attack on Titan
(
  'Eren Yeager',
  'Attack on Titan',
  'Founding Titan',
  'https://static.wikia.nocookie.net/shingekinokyojin/images/3/3a/Eren_Jaeger_%28Anime%29_character_image_%28Founding_Titan%29.png',
  'Eren Yeager (エレン・イェーガー Eren Yēgā?) was a former member of the Survey Corps.',
  ARRAY['power','durability','overall']::battle_category[],
  true
),
(
  'Levi Ackerman',
  'Attack on Titan',
  'Year 850',
  'https://static.wikia.nocookie.net/shingekinokyojin/images/f/f0/Levi_Ackermann_%28Anime%29_character_image_%28850%29.png',
  'Levi Ackermann (リヴァイ・アッカーマン Rivai Akkāman?), often formally referred to as Captain Levi.',
  ARRAY['speed','combat','strength']::battle_category[],
  true
),

-- My Hero Academia
(
  'All Might',
  'My Hero Academia',
  'Prime',
  'https://static.wikia.nocookie.net/bokunoheroacademia/images/c/cd/Toshinori_Yagi_Golden_Age_Hero_Costume_%28Anime%29.png',
  'Toshinori Yagi (八木俊典 Yagi Toshinori?), also known as All Might (オールマイト Ōru Maito?), is one of the main characters of My Hero Academia.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Izuku Midoriya',
  'My Hero Academia',
  'Full Cowl 100%',
  'https://static.wikia.nocookie.net/bokunoheroacademia/images/8/80/One_For_All_Full_Cowl_-_100%25_%28Anime%29.png',
  'Izuku Midoriya (緑谷出久 Midoriya Izuku?), also known as the One For All Hero: Deku (ワン・フォー・オール ヒーロー デク Wan Fō Ōru Hīrō: Deku?),[4] is the main protagonist of My Hero Academia.',
  ARRAY['strength','speed','power','combat','intelligence']::battle_category[],
  true
),
(
  'Shigaraki Tomura',
  'My Hero Academia',
  'All For One Awakened',
  'https://static.wikia.nocookie.net/villains/images/2/2a/Tomura_Final_War_Outfit.webp',
  'Tomura Shigaraki (死柄木弔 Shigaraki Tomura?), real name Tenko Shimura (志村転弧 Shimura Tenko?), was the main antagonist of My Hero Academia.',
  ARRAY['strength','power','durability','overall']::battle_category[],
  true
),

-- Hunter x Hunter
(
  'Gon Freecss',
  'Hunter x Hunter',
  'Adult Transformation',
  'https://static.wikia.nocookie.net/p__/images/e/e5/Adult_gon.png',
  'Gon Freecss (ゴン＝フリークス, Gon Furīkusu) is a Rookie Hunter and the son of Ging Freecss. Finding his father is Gon`s motivation in becoming a Hunter.',
  ARRAY['strength','speed','power','combat']::battle_category[],
  true
),
(
  'Killua Zoldyck',
  'Hunter x Hunter',
  'Godspeed',
  'https://static.wikia.nocookie.net/hunterxhunter/images/b/b7/Killua_activating_Godspeed.png',
  'Killua Zoldyck (キルア＝ゾルディック, Kirua Zorudikku) is the third child of Silva and Kikyo Zoldyck and the heir of the Zoldyck Family, until he runs away from home and becomes a Rookie Hunter.',
  ARRAY['speed','combat','intelligence']::battle_category[],
  true
),
(
  'Meruem',
  'Hunter x Hunter',
  'Post-Rose',
  'https://static.wikia.nocookie.net/hunterxhunter/images/5/5d/Meruem_Komugi_ep_135.png',
  'Meruem (メルエム, Meruemu) was the most powerful offspring of the Chimera Ant Queen. He was known as the "King" (王, Ō) of the Chimera Ants,[2] and served as the main antagonist of the Chimera Ant arc.',
  ARRAY['strength','speed','intelligence','power','combat','durability','overall']::battle_category[],
  true
),

-- DC Comics
(
  'Superman',
  'DC Comics',
  'Post-Crisis',
  'https://static.wikia.nocookie.net/vsbattles/images/4/42/SupermanPrime.jpeg',
  'Version of the Man of Steel introduced in DC Comics following the 1985–1986 Crisis on Infinite Earths event.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Batman',
  'DC Comics',
  'Version of the Dark Knight introduced in DC Comics following the 1985–1986 Crisis on Infinite Earths event.',
  'https://static.wikia.nocookie.net/character-level/images/f/f9/Batman_render_by_HIT_IT.png',
  'World`s greatest detective, peak human with preparation for every scenario.',
  ARRAY['intelligence','combat','speed']::battle_category[],
  true
),

-- Marvel Comics
(
  'Thor',
  'Marvel Comics',
  'Rune King',
  'https://static.wikia.nocookie.net/multiversology/images/0/0b/Rune_King_Thor.jpg',
  'Rune King Thor is a version of the character that appeared at the end of volume 2 of the Thor title.',
  ARRAY['strength','speed','power','combat','durability','overall']::battle_category[],
  true
),
(
  'Spider-Man',
  'Marvel Comics',
  'New Ultimate (Earth-6160)',
  'https://static.wikia.nocookie.net/marveldatabase/images/4/41/Ultimate_Spider-Man_Vol_3_1_Checchetto_Third_Printing_Variant.jpg',
  'Peter`s reality had secretly become invaded by the villainous Maker, who sought to rewrite history to his image. Equipped with foreknowledge of the world`s intended status quo, he interfered in the emergence of super heroes.',
  ARRAY['strength','speed','combat','intelligence']::battle_category[],
  true
),
(
  'Hulk',
  'Marvel Comics',
  'World Breaker',
  'https://static.wikia.nocookie.net/hulk/images/3/37/Incredible_Hulks_-_Heart_of_the_Monster-064.jpg',
  'The physically strongest Hulk based on the Savage Hulk with a warriors intelligence.',
  ARRAY['strength','power','durability','combat','overall']::battle_category[],
  true
);
