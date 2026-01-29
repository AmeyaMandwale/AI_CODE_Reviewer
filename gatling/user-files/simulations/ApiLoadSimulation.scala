package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class ApiLoadSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("http://localhost:5142")
    .acceptHeader("application/json")

  val scn = scenario("Repository API Load Test")
    .exec(
      http("Get Repositories")
        .get("/api/repository?orgId=1&provider=github")
        .check(status.is(200))
    )

  setUp(
    scn.inject(rampUsers(50) during (30.seconds))
  ).protocols(httpProtocol)
}
