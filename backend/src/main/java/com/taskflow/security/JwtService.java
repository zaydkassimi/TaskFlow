package com.taskflow.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.taskflow.config.JwtProperties;
import com.taskflow.entity.User;
import com.taskflow.exception.InvalidTokenException;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * Creates and verifies stateless HS256 access tokens with Nimbus JOSE. Refresh tokens are
 * opaque and handled separately by {@code RefreshTokenService}.
 */
@Service
public class JwtService {

    private static final JWSAlgorithm ALGORITHM = JWSAlgorithm.HS256;
    private static final int MIN_SECRET_BYTES = 32;
    private static final String CLAIM_USER_ID = "uid";
    private static final String CLAIM_ROLE = "role";

    private final JwtProperties properties;
    private final MACSigner signer;
    private final MACVerifier verifier;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] secretBytes = properties.secret() == null
                ? new byte[0]
                : properties.secret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret must be at least " + MIN_SECRET_BYTES + " bytes (HS256); "
                            + "generate one with 'openssl rand -base64 48'");
        }
        SecretKey key = new SecretKeySpec(secretBytes, "HmacSHA256");
        try {
            this.signer = new MACSigner(key);
            this.verifier = new MACVerifier(key);
        } catch (JOSEException ex) {
            throw new IllegalStateException("Unable to initialise JWT cryptography", ex);
        }
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .jwtID(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_ROLE, user.getRole().name())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(properties.accessTtl())))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(ALGORITHM), claims);
        try {
            jwt.sign(signer);
        } catch (JOSEException ex) {
            throw new IllegalStateException("Unable to sign JWT", ex);
        }
        return jwt.serialize();
    }

    public JWTClaimsSet parse(String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidTokenException("Missing access token");
        }
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(verifier)) {
                throw new InvalidTokenException("Invalid access token signature");
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date expiry = claims.getExpirationTime();
            if (expiry == null || expiry.toInstant().isBefore(Instant.now())) {
                throw new InvalidTokenException("Access token has expired");
            }
            return claims;
        } catch (ParseException | JOSEException ex) {
            throw new InvalidTokenException("Malformed access token");
        }
    }
}
