package ch.lsh.ims.jukestack.handlers;

public final class SQLQueries {

    /**
     * SQL query to insert a new user into the TBenutzer table.
     * @see UserHandler#createUser(io.vertx.ext.web.RoutingContext)
     */
    public static final String INSERT_USER = """
        insert into TBenutzer 
        (benutzerEmail, benutzerNachname, benutzerVorname, benutzerPWHash, benutzerPWSalt) 
        values (?, ?, ?, ?, ?)
    """;

    /**
     * SQL query to check if a user with a specific email exists in the TBenutzer table.
     * @see UserHandler#createUser(io.vertx.ext.web.RoutingContext)
     */
    public static final String SELECT_USER_BY_EMAIL = """
        select * from TBenutzer where benutzerEmail = ?
    """;

    /**
     * SQL query to fetch user credentials for login.
     * @see UserHandler#login(io.vertx.ext.web.RoutingContext)
     */
    public static final String SELECT_USER_CREDENTIALS = """
        select benutzerPWHash, benutzerPWSalt 
        from TBenutzer 
        where benutzerEmail = ?
    """;

    /**
     * SQL query to fetch user information by user ID.
     * @see UserHandler#getUserInfo(io.vertx.ext.web.RoutingContext)
     */
    public static final String SELECT_USER_INFO_BY_EMAIL = """
        select benutzerNachname, benutzerVorname, benutzerIstAdmin 
        from TBenutzer 
        where benutzerEmail = ?
    """;

    /**
     * SQL Query to get all available songs
     * @see SongHandler#listSongs(io.vertx.ext.web.RoutingContext)
     */
    public static final String LIST_AVAILABLE_SONGS = """
        with MaxAusleihenEnde as (
            select songId, max(ausleihEnde) ausleihEnde
            from TAusleihen
            group by songId
        )
        select * from TAusleihen
        natural join MaxAusleihenEnde natural right join TSongs
        where ausleihId is null or ausleihEnde < now()
    """;

    /**
     * SQL Query to get musicians for given song IDs
     * @param songIds list of song IDs
     * @see SongHandler#listSongs(io.vertx.ext.web.RoutingContext)
     */
    public static final String GET_MUSICIANS_FOR_SONGS = """
        select songId, musikerId, musikerName 
        from TMusiker 
        natural join TBeitraege 
        where songId in (?)
    """;

    /**
     * SQL Query to get lendings for a user
     * @param benutzerEmail users mail
     * @see SongHandler#listLendings(io.vertx.ext.web.RoutingContext)
     */
    public static final String GET_LENDINGS_FOR_USER = """
        select * 
        from TAusleihen 
        natural join TSongs 
        where benutzerEmail = ? 
        and ausleihEnde > now()
    """;

    /**
     * SQL Query to check the number of active lendings for a user
     * @param benutzerEmail users mail
     * @see SongHandler#lendSong(io.vertx.ext.web.RoutingContext)
     */
    public static final String COUNT_ACTIVE_LENDINGS = """
        select count(*) 
        from TAusleihen 
        where benutzerEmail = ? 
        and ausleihEnde > now()
    """;

    /**
     * SQL Query to check if a song is already lent
     * @param songId song ID
     * @see SongHandler#lendSong(io.vertx.ext.web.RoutingContext)
     */
    public static final String CHECK_SONG_LENT = """
        select * 
        from TAusleihen 
        where songId = ? 
        and ausleihEnde > now()
    """;

    /**
     * SQL Query to insert a new lending
     * @param songId song ID
     * @param benutzerEmail users mail
     * @param ausleihTage number of days for the lending
     * @see SongHandler#lendSong(io.vertx.ext.web.RoutingContext)
     */
    public static final String INSERT_LENDING = """
        insert into TAusleihen (songId, benutzerEmail, ausleihStart, ausleihEnde) 
        values (?, ?, now(), now() + interval ? day)
    """;

    /**
     * SQL Query to update a lending record to mark it as returned
     * @param songId song ID
     * @param benutzerEmail users mail
     * @see SongHandler#returnSong(io.vertx.ext.web.RoutingContext)
     */
    public static final String RETURN_SONG = """
        update TAusleihen 
        set ausleihEnde = now() - interval 1 second
        where songId = ? 
        and benutzerEmail = ? 
        and ausleihEnde > now()
    """;

    /**
     * SQL Query to fetch details of a song and its lending status for a user
     * @param songId song ID
     * @param benutzerEmail users mail
     * @see SongHandler#generateListenLink(io.vertx.ext.web.RoutingContext)
     */
    public static final String GET_LISTEN_OBJECT = """
        select * from TSongs natural join TAusleihen where songId = ? and benutzerEmail = ? and ausleihEnde > now()
    """;


    /**
     * SQL Query to get all users
     * @see AdminHandler#listUsers(io.vertx.ext.web.RoutingContext)
     */
    public static final String SELECT_ALL_USERS = """
        select * from TBenutzer where benutzerIstAdmin = 0
    """;

    /**
     * SQL Query to update a lengings days
     * @param ausleihTage number of days for the lending
     * @param ausleihId lending ID
     * @see AdminHandler#updateUserLend(io.vertx.ext.web.RoutingContext)
     */
    public static final String UPDATE_LEND_DAYS_WITH_CHECK = """
        update TAusleihen 
        set ausleihEnde = ausleihStart + interval ? day 
        where ausleihId = ? 
        and ausleihEnde > now()
    """;

    /**
     * SQL Query to update a lengings days
     * @param ausleihId lending ID
     * @see AdminHandler#returnUserLend(io.vertx.ext.web.RoutingContext)
     */
    public static final String RETURN_SONG_ADMIN = """
        update TAusleihen 
        set ausleihEnde = now() - interval 1 second
        where ausleihId = ? 
        and ausleihEnde > now()
    """;

}
