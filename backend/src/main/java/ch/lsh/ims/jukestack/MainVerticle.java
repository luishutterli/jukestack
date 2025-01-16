package ch.lsh.ims.jukestack;

import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;

import java.time.Duration;

import ch.lsh.ims.jukestack.CloudflareR2Client.S3Config;
import ch.lsh.ims.jukestack.handlers.AdminHandler;
import ch.lsh.ims.jukestack.handlers.SongHandler;
import ch.lsh.ims.jukestack.handlers.UserHandler;
import io.github.cdimascio.dotenv.Dotenv;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.mysqlclient.MySQLConnectOptions;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.PoolOptions;

public class MainVerticle extends AbstractVerticle {

  private Pool dbPool;

  private static final String API_BASE = "/api";
  private static final String USER_ROUTE = API_BASE + "/user";
  private static final String AUTH_ROUTE = API_BASE + "/auth";
  private static final String SONGS_ROUTE = API_BASE + "/songs";
  private static final String LEND_ROUTE = API_BASE + "/lend";
  private static final String ADMIN_ROUTE = API_BASE + "/admin";

  private static final String VERSION = "0.1.1";

  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    // MySQL Connection
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    String dbUser = dotenv.get("DB_USER");
    String dbPassword = dotenv.get("DB_PASSWORD");

    MySQLConnectOptions connectOptions = new MySQLConnectOptions()
        .setPort(3316)
        .setHost("i-kf.ch")
        .setDatabase("JukeStackDB_Luis")
        .setUser(dbUser)
        .setPassword(dbPassword);

    PoolOptions poolOptions = new PoolOptions().setMaxSize(2);

    dbPool = Pool.pool(vertx, connectOptions, poolOptions);

    // Cloudflare R2 Storage
    String r2AccountId = dotenv.get("R2_ACCOUNT_ID");
    String r2AccessKey = dotenv.get("R2_ACCESS_KEY");
    String r2SecretKey = dotenv.get("R2_SECRET_KEY");

    S3Config s3Config = new S3Config(r2AccountId, r2AccessKey, r2SecretKey);
    CloudflareR2Client r2Client = new CloudflareR2Client(s3Config);

    // Authentication Systems
    HashUtils hashUtils = new HashUtils(16, 1);
    AuthenticationManager authManager = new AuthenticationManager(dbPool, hashUtils, 32, Duration.ofMinutes(30), false);
    // TODO: Load settings from kv store table

    // ROUTES
    Router router = Router.router(vertx);
    router.route().handler(BodyHandler.create());
    // CORS configuration
    router.route().handler(CorsHandler.create("*")
        // .addRelativeOrigin("http://localhost:5173")
        // .addRelativeOrigin("https://jukestack.web.app")
        // .addRelativeOrigin("https://jukestack.ch")
        .allowedMethod(HttpMethod.GET)
        .allowedMethod(HttpMethod.POST)
        .allowedMethod(HttpMethod.PUT)
        .allowedMethod(HttpMethod.DELETE)
        .allowedHeader("Content-Type")
        .allowedHeader("Authorization")
        .allowCredentials(true));
    router.route().handler(ctx -> {
      ctx.response().putHeader("Server", "Jukestack/" + VERSION + " (Vert.x) Server by Luis Hutterli");
      ctx.response().putHeader("X-Server", "Jukestack/" + VERSION + " (Vert.x) Server by Luis Hutterli");
      ctx.response().putHeader("Content-Type", "application/json");
      ctx.response().putHeader("X-Timestamp", Long.toString(System.currentTimeMillis()));
      ctx.next();
    });

    // /api/user
    UserHandler userHandler = new UserHandler(dbPool, authManager);
    router.post(USER_ROUTE).handler(userHandler::createUser); // Create user
    router.get(USER_ROUTE).handler(userHandler::gerUserInfo); // Get user info
    router.put(USER_ROUTE).handler(null); // Update user info
    router.delete(USER_ROUTE).handler(null); // Delete user

    // /api/auth
    router.post(AUTH_ROUTE + "/login").handler(userHandler::login); // Login
    router.post(AUTH_ROUTE + "/logout").handler(null); // Logout
    router.get(AUTH_ROUTE + "/verify").handler(userHandler::verify); // Verify session
    router.post(AUTH_ROUTE + "/refresh").handler(userHandler::refresh); // Refresh session

    // /api/songs
    SongHandler songHandler = new SongHandler(dbPool, authManager, r2Client, 5, 1);
    router.get(SONGS_ROUTE).handler(songHandler::listSongs); // Get songs

    // /api/lend
    router.get(LEND_ROUTE).handler(songHandler::listLendings); // Get lendings
    router.post(LEND_ROUTE + "/:id").handler(songHandler::lendSong); // Lend song
    router.delete(LEND_ROUTE + "/:id").handler(songHandler::returnSong); // Return song
    router.get(LEND_ROUTE + "/:id/listen").handler(songHandler::generateListenLink); // Listen to song
    
    // /api/admin
    AdminHandler adminHandler = new AdminHandler(dbPool, authManager);
    router.get(ADMIN_ROUTE + "/users").handler(adminHandler::listUsers); // Get all users
    router.get(ADMIN_ROUTE + "/users/:email/lend").handler(adminHandler::listLentSongs); // List lent songs
    router.put(ADMIN_ROUTE + "/lend/:lendId").handler(adminHandler::updateUserLend); // Update a lend
    router.delete(ADMIN_ROUTE + "/lend/:lendId").handler(adminHandler::returnUserLend); // Return a lend

    vertx.createHttpServer().requestHandler(router).listen(8080, http -> {
      if (http.succeeded()) {
        startPromise.complete();
        System.out.println("HTTP server started on port 8080");
      } else {
        startPromise.fail(http.cause());
      }
    });
  }

  @Override
  public void stop() {
    System.out.println("Shutting down...");
    dbPool.close();
  }
}
