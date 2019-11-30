--
-- PostgreSQL database dump
--

-- Dumped from database version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)
-- Dumped by pg_dump version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: clicks; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.clicks (
    id integer NOT NULL,
    vk_id integer NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.clicks OWNER TO "user";

--
-- Name: clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.clicks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.clicks_id_seq OWNER TO "user";

--
-- Name: clicks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.clicks_id_seq OWNED BY public.clicks.id;


--
-- Name: daily_stats; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.daily_stats (
    id integer NOT NULL,
    date timestamp with time zone NOT NULL,
    click_groups jsonb NOT NULL,
    user_clicks jsonb NOT NULL,
    subscriptions jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.daily_stats OWNER TO "user";

--
-- Name: daily_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.daily_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.daily_stats_id_seq OWNER TO "user";

--
-- Name: daily_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.daily_stats_id_seq OWNED BY public.daily_stats.id;


--
-- Name: drawings; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.drawings (
    id integer NOT NULL,
    active boolean NOT NULL,
    name character varying(255) NOT NULL,
    post_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone DEFAULT '2019-11-29 19:00:00+00'::timestamp with time zone NOT NULL
);


ALTER TABLE public.drawings OWNER TO "user";

--
-- Name: drawings_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.drawings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.drawings_id_seq OWNER TO "user";

--
-- Name: drawings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.drawings_id_seq OWNED BY public.drawings.id;


--
-- Name: group_users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.group_users (
    id integer NOT NULL,
    vk_id integer NOT NULL,
    status boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.group_users OWNER TO "user";

--
-- Name: group_users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.group_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.group_users_id_seq OWNER TO "user";

--
-- Name: group_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.group_users_id_seq OWNED BY public.group_users.id;


--
-- Name: reposts; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.reposts (
    id integer NOT NULL,
    original_post_id character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    owner_id integer DEFAULT 0 NOT NULL,
    post_id integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.reposts OWNER TO "user";

--
-- Name: reposts_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.reposts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reposts_id_seq OWNER TO "user";

--
-- Name: reposts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.reposts_id_seq OWNED BY public.reposts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    vk_id integer NOT NULL,
    "lastMessageDate" timestamp with time zone NOT NULL,
    state jsonb,
    subscriptions jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    first_name character varying(255) DEFAULT ''::character varying NOT NULL,
    last_name character varying(255) DEFAULT ''::character varying NOT NULL,
    sex character varying(255) DEFAULT 'UNKNOWN'::character varying NOT NULL,
    b_date character varying(255)
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: clicks id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.clicks ALTER COLUMN id SET DEFAULT nextval('public.clicks_id_seq'::regclass);


--
-- Name: daily_stats id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.daily_stats ALTER COLUMN id SET DEFAULT nextval('public.daily_stats_id_seq'::regclass);


--
-- Name: drawings id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.drawings ALTER COLUMN id SET DEFAULT nextval('public.drawings_id_seq'::regclass);


--
-- Name: group_users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.group_users ALTER COLUMN id SET DEFAULT nextval('public.group_users_id_seq'::regclass);


--
-- Name: reposts id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reposts ALTER COLUMN id SET DEFAULT nextval('public.reposts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: clicks; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.clicks (id, vk_id, payload, created_at, updated_at) FROM stdin;
1	521725484	{"command": "poster"}	2019-11-26 13:31:09.813+00	2019-11-26 13:31:09.813+00
2	521725484	{"type": "week", "command": "poster/type"}	2019-11-26 13:31:11.695+00	2019-11-26 13:31:11.695+00
3	521725484	{"command": "poster/type/week", "weekStart": 1574622000000}	2019-11-26 13:31:13.591+00	2019-11-26 13:31:13.591+00
4	521725484	{"type": "genres", "command": "poster/type"}	2019-11-26 13:31:16.972+00	2019-11-26 13:31:16.972+00
5	521725484	{"genre": "COVERS", "command": "poster/type/genre"}	2019-11-26 13:31:18.76+00	2019-11-26 13:31:18.76+00
6	521725484	{"genre": "POP", "command": "poster/type/genre"}	2019-11-26 13:31:20.735+00	2019-11-26 13:31:20.735+00
7	521725484	{"command": "audio_materials"}	2019-11-26 13:31:24.83+00	2019-11-26 13:31:24.83+00
8	521725484	{"command": "audio_materials/digests"}	2019-11-26 13:31:25.93+00	2019-11-26 13:31:25.93+00
9	521725484	{"command": "drawings"}	2019-11-26 13:31:29.716+00	2019-11-26 13:31:29.716+00
10	521725484	{"command": "drawings/drawing", "drawingId": 1}	2019-11-26 13:31:32.564+00	2019-11-26 13:31:32.564+00
11	521725484	{"command": "services"}	2019-11-26 13:31:38.043+00	2019-11-26 13:31:38.043+00
12	521725484	{"command": "services/service", "service": "stickers_design"}	2019-11-26 13:31:39.627+00	2019-11-26 13:31:39.627+00
13	521725484	{"command": "poster"}	2019-11-26 13:33:28.743+00	2019-11-26 13:33:28.743+00
14	521725484	{"type": "week", "command": "poster/type"}	2019-11-26 13:33:30.731+00	2019-11-26 13:33:30.731+00
15	521725484	{"command": "drawings"}	2019-11-26 13:33:33.727+00	2019-11-26 13:33:33.727+00
16	521725484	{"command": "drawings/drawing", "drawingId": 1}	2019-11-26 13:33:34.861+00	2019-11-26 13:33:34.861+00
17	16409350	{"command": "poster"}	2019-11-27 06:32:33.777+00	2019-11-27 06:32:33.777+00
18	16409350	{"type": "genres", "command": "poster/type"}	2019-11-27 06:32:38.731+00	2019-11-27 06:32:38.731+00
19	16409350	{"genre": "ABOUT_MUSIC", "command": "poster/type/genre"}	2019-11-27 06:32:47.445+00	2019-11-27 06:32:47.445+00
20	16409350	{"genre": "ROCK", "command": "poster/type/genre"}	2019-11-27 06:32:51.672+00	2019-11-27 06:32:51.672+00
21	16409350	{"genre": "COVERS", "command": "poster/type/genre"}	2019-11-27 06:32:54.72+00	2019-11-27 06:32:54.72+00
22	16409350	{"genre": "INDIE", "command": "poster/type/genre"}	2019-11-27 06:32:56.75+00	2019-11-27 06:32:56.75+00
23	16409350	{"genre": "HIP_HOP", "command": "poster/type/genre"}	2019-11-27 06:32:58.759+00	2019-11-27 06:32:58.759+00
24	16409350	{"genre": "FOLK", "command": "poster/type/genre"}	2019-11-27 06:33:00.964+00	2019-11-27 06:33:00.964+00
25	16409350	{"command": "text_materials"}	2019-11-27 06:33:06.682+00	2019-11-27 06:33:06.682+00
26	16409350	{"command": "text_materials/group_history"}	2019-11-27 06:33:09.71+00	2019-11-27 06:33:09.71+00
27	16409350	{"command": "text_materials/longread"}	2019-11-27 06:33:53.023+00	2019-11-27 06:33:53.023+00
28	16409350	{"command": "services"}	2019-11-27 06:34:00.727+00	2019-11-27 06:34:00.727+00
29	16409350	{"command": "services/service", "service": "stickers_design"}	2019-11-27 06:34:03.98+00	2019-11-27 06:34:03.98+00
30	16409350	{"command": "audio_materials"}	2019-11-27 06:35:00.991+00	2019-11-27 06:35:00.991+00
31	16409350	{"command": "audio_materials/digests"}	2019-11-27 06:35:03.69+00	2019-11-27 06:35:03.69+00
32	16409350	{"command": "services"}	2019-11-27 06:35:32.806+00	2019-11-27 06:35:32.806+00
33	521725484	{"command": "drawings"}	2019-11-29 08:41:02.532+00	2019-11-29 08:41:02.532+00
34	521725484	{"command": "drawings/drawing", "drawingId": 1}	2019-11-29 08:41:08.492+00	2019-11-29 08:41:08.492+00
35	521725484	{"command": "drawings"}	2019-11-29 10:55:08.746+00	2019-11-29 10:55:08.746+00
36	521725484	{"command": "drawings/drawing", "drawingId": 3}	2019-11-29 10:55:10.79+00	2019-11-29 10:55:10.79+00
37	521725484	{"command": "poster"}	2019-11-29 15:41:42.106+00	2019-11-29 15:41:42.106+00
38	521725484	{"command": "poster"}	2019-11-29 15:42:50.672+00	2019-11-29 15:42:50.672+00
39	521725484	{"command": "refresh_keyboard"}	2019-11-29 16:21:21.801+00	2019-11-29 16:21:21.801+00
40	521725484	{"command": "poster"}	2019-11-29 16:21:40.964+00	2019-11-29 16:21:40.964+00
41	521725484	{"type": "day", "command": "poster/type"}	2019-11-29 16:21:46.904+00	2019-11-29 16:21:46.904+00
\.


--
-- Data for Name: daily_stats; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.daily_stats (id, date, click_groups, user_clicks, subscriptions, created_at, updated_at) FROM stdin;
1	2019-11-25 19:00:00+00	[{"count": 2, "payload": {"command": "poster"}}, {"count": 2, "payload": {"type": "week", "command": "poster/type"}}, {"count": 1, "payload": {"command": "poster/type/week"}}, {"count": 1, "payload": {"type": "genres", "command": "poster/type"}}, {"count": 1, "payload": {"genre": "COVERS", "command": "poster/type/genre"}}, {"count": 1, "payload": {"genre": "POP", "command": "poster/type/genre"}}, {"count": 1, "payload": {"command": "audio_materials"}}, {"count": 1, "payload": {"command": "audio_materials/digests"}}, {"count": 2, "payload": {"command": "drawings"}}, {"count": 2, "payload": {"command": "drawings/drawing", "drawingId": 1}}, {"count": 1, "payload": {"command": "services"}}, {"count": 1, "payload": {"command": "services/service", "service": "stickers_design"}}]	{"521725484": 16}	{"POSTER": 1, "DRAWINGS": 2, "RELEASES": 1, "PLAYLISTS": 1, "FOR_MUSICIANS": 1, "TEXT_MATERIALS": 1, "AUDIO_MATERIALS": 2}	2019-11-26 19:01:00.125+00	2019-11-26 19:01:00.125+00
2	2019-11-26 19:00:00+00	[{"count": 1, "payload": {"command": "poster"}}, {"count": 1, "payload": {"type": "genres", "command": "poster/type"}}, {"count": 1, "payload": {"genre": "ABOUT_MUSIC", "command": "poster/type/genre"}}, {"count": 1, "payload": {"genre": "ROCK", "command": "poster/type/genre"}}, {"count": 1, "payload": {"genre": "COVERS", "command": "poster/type/genre"}}, {"count": 1, "payload": {"genre": "INDIE", "command": "poster/type/genre"}}, {"count": 1, "payload": {"genre": "HIP_HOP", "command": "poster/type/genre"}}, {"count": 1, "payload": {"genre": "FOLK", "command": "poster/type/genre"}}, {"count": 1, "payload": {"command": "text_materials"}}, {"count": 1, "payload": {"command": "text_materials/group_history"}}, {"count": 1, "payload": {"command": "text_materials/longread"}}, {"count": 2, "payload": {"command": "services"}}, {"count": 1, "payload": {"command": "services/service", "service": "stickers_design"}}, {"count": 1, "payload": {"command": "audio_materials"}}, {"count": 1, "payload": {"command": "audio_materials/digests"}}]	{"16409350": 16}	{"POSTER": 2, "DRAWINGS": 2, "RELEASES": 1, "PLAYLISTS": 2, "FOR_MUSICIANS": 2, "TEXT_MATERIALS": 2, "AUDIO_MATERIALS": 2}	2019-11-27 19:01:00.089+00	2019-11-27 19:01:00.089+00
3	2019-11-27 19:00:00+00	[]	{}	{"POSTER": 2, "DRAWINGS": 3, "RELEASES": 1, "PLAYLISTS": 2, "FOR_MUSICIANS": 2, "TEXT_MATERIALS": 2, "AUDIO_MATERIALS": 2}	2019-11-28 19:01:00.108+00	2019-11-28 19:01:00.108+00
4	2019-11-28 19:00:00+00	[{"count": 2, "payload": {"command": "drawings"}}, {"count": 1, "payload": {"command": "drawings/drawing", "drawingId": 1}}, {"count": 1, "payload": {"command": "drawings/drawing", "drawingId": 3}}, {"count": 3, "payload": {"command": "poster"}}, {"count": 1, "payload": {"command": "refresh_keyboard"}}, {"count": 1, "payload": {"type": "day", "command": "poster/type"}}]	{"521725484": 9}	{"POSTER": 2, "DRAWINGS": 3, "RELEASES": 1, "PLAYLISTS": 2, "FOR_MUSICIANS": 2, "TEXT_MATERIALS": 2, "AUDIO_MATERIALS": 2}	2019-11-29 19:01:00.113+00	2019-11-29 19:01:00.113+00
\.


--
-- Data for Name: drawings; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.drawings (id, active, name, post_id, created_at, updated_at, expires_at) FROM stdin;
2	t	234	-164134127_284	2019-11-27 15:31:55.056+00	2019-11-28 18:07:49.96+00	2019-12-01 19:00:00+00
3	t	новый розыгрыш 2	-164134127_407	2019-11-28 15:10:58.096+00	2019-11-29 10:54:12.006+00	2019-11-30 19:00:00+00
1	f	розыгрыш двух билетов на саундфест	-164134127_401	2019-11-26 12:48:10.846+00	2019-11-29 19:05:00.114+00	2019-11-29 19:00:00+00
\.


--
-- Data for Name: group_users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.group_users (id, vk_id, status, created_at, updated_at) FROM stdin;
1	16409350	t	2019-11-27 06:32:12.034+00	2019-11-27 06:32:12.034+00
\.


--
-- Data for Name: reposts; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.reposts (id, original_post_id, created_at, updated_at, owner_id, post_id) FROM stdin;
1	-164134127_392	2019-11-28 16:08:19.046+00	2019-11-28 16:22:37.383+00	521725484	9
2	-164134127_392	2019-11-28 16:08:48.97+00	2019-11-28 16:22:37.384+00	175810060	108
3	-164134127_405	2019-11-28 16:09:17.79+00	2019-11-28 16:22:37.384+00	-187590429	1
4	-164134127_284	2019-11-28 16:52:41.913+00	2019-11-28 16:52:41.913+00	521725484	10
5	-164134127_401	2019-11-29 08:41:24.941+00	2019-11-29 08:41:24.941+00	521725484	11
6	-164134127_407	2019-11-29 10:55:27.842+00	2019-11-29 10:55:27.842+00	521725484	12
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.users (id, vk_id, "lastMessageDate", state, subscriptions, created_at, updated_at, first_name, last_name, sex, b_date) FROM stdin;
4	184913972	2019-11-29 17:36:44+00	{"command": "admin/send_message_to_users/group/set_group"}	["PLAYLISTS", "TEXT_MATERIALS", "FOR_MUSICIANS", "DRAWINGS", "POSTER"]	2019-11-27 06:37:05.851+00	2019-11-30 00:15:00.156+00	Александр	Вязьмитинов	MALE	\N
1	175810060	2019-11-29 17:26:17+00	\N	["POSTER", "PLAYLISTS", "RELEASES", "TEXT_MATERIALS", "AUDIO_MATERIALS", "DRAWINGS", "FOR_MUSICIANS"]	2019-11-26 12:47:43.039+00	2019-11-30 00:15:00.157+00	Даниил	Ворончихин	MALE	\N
2	521725484	2019-11-29 16:22:23+00	\N	["AUDIO_MATERIALS", "DRAWINGS"]	2019-11-26 13:31:09.702+00	2019-11-29 16:22:24.138+00	Саша	Балябина	FEMALE	5.9.1987
3	16409350	2019-11-28 20:02:26+00	\N	[]	2019-11-27 06:32:16.651+00	2019-11-29 15:33:23.284+00	Дмитрий	Овинов	MALE	17.8
\.


--
-- Name: clicks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.clicks_id_seq', 41, true);


--
-- Name: daily_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.daily_stats_id_seq', 4, true);


--
-- Name: drawings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.drawings_id_seq', 3, true);


--
-- Name: group_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.group_users_id_seq', 1, true);


--
-- Name: reposts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.reposts_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: clicks clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.clicks
    ADD CONSTRAINT clicks_pkey PRIMARY KEY (id);


--
-- Name: daily_stats daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.daily_stats
    ADD CONSTRAINT daily_stats_pkey PRIMARY KEY (id);


--
-- Name: drawings drawings_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.drawings
    ADD CONSTRAINT drawings_pkey PRIMARY KEY (id);


--
-- Name: group_users group_users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_pkey PRIMARY KEY (id);


--
-- Name: reposts reposts_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reposts
    ADD CONSTRAINT reposts_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_vk_id_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_vk_id_key UNIQUE (vk_id);


--
-- PostgreSQL database dump complete
--

