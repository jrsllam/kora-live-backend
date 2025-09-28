-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS leagues;

-- Create Leagues Table
CREATE TABLE leagues (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Create Teams Table
CREATE TABLE teams (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(255) NOT NULL
);

-- Create Matches Table
CREATE TABLE matches (
    id VARCHAR(255) PRIMARY KEY,
    league_id VARCHAR(255) REFERENCES leagues(id) ON DELETE CASCADE,
    home_team_id VARCHAR(255) REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id VARCHAR(255) REFERENCES teams(id) ON DELETE CASCADE,
    date_time TIMESTAMPTZ,
    stadium VARCHAR(255),
    broadcasters VARCHAR(255),
    status VARCHAR(50),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    events JSONB DEFAULT '[]'::jsonb,
    -- Professional Timer Fields
    current_half VARCHAR(50) DEFAULT 'لم تبدأ',
    timer_running BOOLEAN DEFAULT FALSE,
    timer_start_time TIMESTAMPTZ,
    elapsed_seconds INT DEFAULT 0,
    first_half_extra_time INT DEFAULT 0,
    second_half_extra_time INT DEFAULT 0
);

-- Create News Table
CREATE TABLE news (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT,
    image_url VARCHAR(255),
    source VARCHAR(255),
    date TIMESTAMPTZ
);

-- Insert Initial Data
INSERT INTO leagues (id, name) VALUES
('l1', 'الدوري الإنجليزي الممتاز'),
('l2', 'دوري أبطال أوروبا'),
('l3', 'الدوري السعودي للمحترفين'),
('l4', 'الدوري الإسباني');

INSERT INTO teams (id, name, logo) VALUES
('t1', 'ليفربول', 'https://picsum.photos/seed/liverpool/100'),
('t2', 'مانشستر سيتي', 'https://picsum.photos/seed/mancity/100'),
('t3', 'ريال مدريد', 'https://picsum.photos/seed/realmadrid/100'),
('t4', 'برشلونة', 'https://picsum.photos/seed/barcelona/100'),
('t5', 'الهلال', 'https://picsum.photos/seed/hilal/100'),
('t6', 'النصر', 'https://picsum.photos/seed/nassr/100'),
('t7', 'بايرن ميونخ', 'https://picsum.photos/seed/bayern/100'),
('t8', 'باريس سان جيرمان', 'https://picsum.photos/seed/psg/100');

INSERT INTO matches (id, league_id, home_team_id, away_team_id, date_time, stadium, broadcasters, status, home_score, away_score, events, current_half, timer_running, elapsed_seconds) VALUES
('m1', 'l3', 't5', 't6', NOW() + INTERVAL '3 hours', 'استاد الملك فهد الدولي', 'SSC Sports', 'جارية الآن', 1, 0, '[{"type": "هدف", "teamId": "t5", "minute": 48, "playerName": "سالم الدوسري"}]', 'الشوط الثاني', true, 3900),
('m2', 'l1', 't1', 't2', NOW(), 'ملعب أنفيلد', 'beIN Sports', 'لم تبدأ', 0, 0, '[]', 'لم تبدأ', false, 0),
('m3', 'l2', 't3', 't7', NOW() + INTERVAL '1 day', 'سانتياغو برنابيو', 'beIN Sports', 'لم تبدأ', 0, 0, '[]', 'لم تبدأ', false, 0),
('m4', 'l2', 't4', 't8', NOW() - INTERVAL '1 day', 'كامب نو', 'beIN Sports', 'انتهت', 3, 2, '[]', 'انتهت', false, 5400),
('m5', 'l2', 't2', 't8', NULL, 'لم يحدد', 'لم يحدد', 'لم يحدد بعد', 0, 0, '[]', 'لم تبدأ', false, 0);

INSERT INTO news (id, title, summary, content, image_url, source, date) VALUES
('n1', 'ليفربول يسعى لتعزيز صفوفه', 'أكدت مصادر مقربة...', E'تفاصيل موسعة حول خطط ليفربول للموسم الجديد.\n الفريق يهدف إلى العودة للمنافسة على لقب الدوري الإنجليزي الممتاز ودوري أبطال أوروبا بعد موسم مخيب للآمال.', 'https://picsum.photos/seed/news1/400/200', 'Sky Sports', NOW()),
('n2', 'ريال مدريد يحتفل باللقب', 'شهدت العاصمة الإسبانية...', E'بعد موسم طويل وشاق، تمكن ريال مدريد من حسم لقب الدوري الإسباني لصالحه.\nجابت حافلة الفريق المكشوفة شوارع مدريد وسط حشود غفيرة من الجماهير التي جاءت لتحية أبطالها.', 'https://picsum.photos/seed/news2/400/200', 'Marca', NOW() - INTERVAL '1 day'),
('n3', 'ميسي يتألق ويسجل هاتريك', 'قاد النجم الأرجنتيني فريقه...', E'واصل الأسطورة ليونيل ميسي إبهار الجماهير في الدوري الأمريكي بأداء فردي رائع.\nفي مباراة الأمس، سجل ميسي ثلاثة أهداف (هاتريك) وصنع هدفين آخرين، ليقود فريقه إلى انتصار كاسح.', 'https://picsum.photos/seed/news3/400/200', 'ESPN', NOW() - INTERVAL '2 days');