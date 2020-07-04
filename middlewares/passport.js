const passportJWT = require("passport-jwt");
const User = require("../services/user");

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = process.env.JWT_SECRET || "danbalacaithuboibac";
//jwtOptions.issuer = "vnbcrip113"
module.exports = (passport) => {
  passport.use(
    new JwtStrategy(jwtOptions, function (jwt_payload, done) {
      console.log("jwt payload received : ", jwt_payload);
      let user = User.getUser({ id: jwt_payload.id });
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
  );
};
