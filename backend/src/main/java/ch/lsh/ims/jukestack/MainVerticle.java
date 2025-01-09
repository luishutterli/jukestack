package ch.lsh.ims.jukestack;

import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;

import java.time.Duration;

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

  private static final String VERSION = "0.1.0";

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

    // Authentication Systems
    HashUtils hashUtils = new HashUtils(16, 3);
    AuthenticationManager authManager = new AuthenticationManager(dbPool, hashUtils, 32, Duration.ofMinutes(30), false);
    // TODO: Load settings from kv store table

    // ROUTES
    Router router = Router.router(vertx);
    router.route().handler(BodyHandler.create());
    // CORS configuration
    router.route().handler(CorsHandler.create()
        .addRelativeOrigin("http://localhost:5173")
        .allowedMethod(HttpMethod.GET)
        .allowedMethod(HttpMethod.POST)
        .allowedMethod(HttpMethod.PUT)
        .allowedMethod(HttpMethod.DELETE)
        .allowedHeader("Content-Type")
        .allowedHeader("Authorization")
        .allowCredentials(true));
    router.route().handler(ctx -> {
      ctx.response().putHeader("Server", "Jukestack/" + VERSION + " (Vert.x) Server by Luis Hutterli");
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
    SongHandler songHandler = new SongHandler(dbPool, authManager);
    router.get(SONGS_ROUTE).handler(songHandler::listSongs); // Get songs
    router.get(SONGS_ROUTE + "/status/:id").handler(null); // Get song status / available ... TODO: Is this needed?
    



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
