import "server-only";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  border: {
    border: "2pt solid #18181b",
    borderRadius: 8,
    padding: 48,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#18181b",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 4,
  },
  body: {
    alignItems: "center",
    gap: 16,
  },
  awardedTo: {
    fontSize: 10,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  scholarName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#18181b",
  },
  mtp: {
    fontSize: 12,
    color: "#3f3f46",
    fontStyle: "italic",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 1.6,
  },
  cohort: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: {
    fontSize: 9,
    color: "#a1a1aa",
  },
  date: {
    fontSize: 10,
    color: "#71717a",
  },
});

function CertificateDocument({
  scholarName,
  mtpText,
  cohortName,
  issuedAt,
}: {
  scholarName: string;
  mtpText: string;
  cohortName: string;
  issuedAt: Date;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.header}>
            <Text style={styles.logo}>ZUVA</Text>
            <Text style={styles.subtitle}>Scholar Hub Certificate</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.awardedTo}>Awarded to</Text>
            <Text style={styles.scholarName}>{scholarName}</Text>
            {mtpText ? <Text style={styles.mtp}>{mtpText}</Text> : null}
            <Text style={styles.cohort}>{cohortName}</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Concept Afrika / MINDS
            </Text>
            <Text style={styles.date}>
              {issuedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Render the certificate PDF to a Buffer for upload to R2. */
export async function generateCertificatePdf(props: {
  scholarName: string;
  mtpText: string;
  cohortName: string;
  issuedAt: Date;
}): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...props} />);
}
