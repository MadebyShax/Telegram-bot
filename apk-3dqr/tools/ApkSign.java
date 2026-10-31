import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Signs or verifies an APK with apksig (APK Signature Scheme v2; v1 is disabled, see build notes).
 *   sign   <in.apk> <out.apk> <keystore.p12> <storePass> <alias> <keyPass>
 *   verify <apk>
 */
public class ApkSign {
    public static void main(String[] a) throws Exception {
        if (a[0].equals("verify")) {
            ApkVerifier.Result r = new ApkVerifier.Builder(new File(a[1])).build().verify();
            System.out.println("verified=" + r.isVerified()
                + " v2=" + r.isVerifiedUsingV2Scheme());
            for (Object e : r.getErrors()) System.out.println("ERROR: " + e);
            for (Object w : r.getWarnings()) System.out.println("WARN: " + w);
            System.exit(r.isVerified() ? 0 : 1);
        }
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (FileInputStream in = new FileInputStream(a[3])) { ks.load(in, a[4].toCharArray()); }
        PrivateKey key = (PrivateKey) ks.getKey(a[5], a[6].toCharArray());
        X509Certificate cert = (X509Certificate) ks.getCertificate(a[5]);
        List<ApkSigner.SignerConfig> signers = new ArrayList<>();
        signers.add(new ApkSigner.SignerConfig.Builder("CERT", key, Collections.singletonList(cert)).build());
        new ApkSigner.Builder(signers)
            .setInputApk(new File(a[1]))
            .setOutputApk(new File(a[2]))
            .setMinSdkVersion(24)
            .setV1SigningEnabled(false)  // v2 only: minSdk 24 (Android 7+) supports it; apksig 2.3.0 v1 path breaks on JDK 17+
            .setV2SigningEnabled(true)
            .build().sign();
        System.out.println("signed: " + a[2]);
    }
}
