import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import { AppBrand } from "@/app/components/ui";
import {
  loadPublicProfile,
  type PublicProfileFeatureBackoff,
} from "@/lib/public-profile";
import { PublicProfileRadar } from "./public-profile-radar";
import { publicProfileStyles as styles } from "./public-profile.styles";

type PublicProfileParams = Promise<{ username: string }>;

function decodeUsername(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function FeatureBackoffList({
  items,
}: {
  items: PublicProfileFeatureBackoff[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol className={styles.featureBackoffList} aria-label="Next on the list">
      {items.map((item) => (
        <li key={`${item.label}-${item.detail ?? ""}`} className={styles.featureBackoffItem}>
          <span className={styles.featureBackoffLabel}>{item.label}</span>
          {item.detail ? (
            <>
              <span className={styles.featureBackoffSeparator}>·</span>
              <span className={styles.featureBackoffDetail}>{item.detail}</span>
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export async function generateMetadata({
  params,
}: {
  params: PublicProfileParams;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadPublicProfile(decodeUsername(username));

  if (!profile) {
    return {
      title: "Profile not found · logit",
    };
  }

  return {
    title: `${profile.displayName} · logit`,
    description: `${profile.displayName}'s public logit training profile.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: PublicProfileParams;
}) {
  const { username } = await params;
  const profile = await loadPublicProfile(decodeUsername(username));

  if (!profile) {
    notFound();
  }

  const stats = [
    { label: "Workouts", value: profile.totalWorkoutsLabel },
    { label: "Sets", value: profile.totalSetsLabel },
    { label: "Volume", value: profile.totalVolumeLabel },
    { label: "Consistency", value: profile.consistencyLabel },
  ];

  return (
    <main className={styles.shell}>
      <section className={styles.stage} aria-label={`${profile.displayName} public profile`}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.homeLink}>
            <AppBrand
              compact
              textClassName="text-[2rem] leading-none font-[520]"
            />
          </Link>
        </div>

        <section className={styles.hero}>
          <div className={styles.identityColumn}>
            <article className={styles.identityCard}>
              <div className={styles.identityTop}>
                <div className={styles.avatar}>
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={`${profile.displayName} profile picture`}
                      width={96}
                      height={96}
                      unoptimized
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>{profile.initials}</span>
                  )}
                </div>
                <div className={styles.nameBlock}>
                  <h1 className={styles.name}>{profile.displayName}</h1>
                  <p className={styles.handle}>{profile.handle}</p>
                  <p className={styles.tenure}>
                    {profile.joinedLabel} · {profile.tenureLabel}
                  </p>
                </div>
              </div>
            </article>

            <section className={styles.featureSection} aria-label="Profile highlights">
              <div className={styles.featureItem}>
                <p className={styles.featureLabel}>Strongest lift</p>
                <p className={styles.featureValue}>{profile.strongestLiftLabel}</p>
                {profile.strongestLiftDetail ? (
                  <p className={styles.featureDetail}>{profile.strongestLiftDetail}</p>
                ) : null}
                <FeatureBackoffList items={profile.strongestLiftBackoffs} />
              </div>
              <div className={styles.featureItem}>
                <p className={styles.featureLabel}>Most trained</p>
                <p className={styles.featureValue}>{profile.mostTrainedExerciseLabel}</p>
                <FeatureBackoffList items={profile.mostTrainedExerciseBackoffs} />
              </div>
              <div className={styles.featureItem}>
                <p className={styles.featureLabel}>Favorite split day</p>
                <p className={styles.featureValue}>{profile.favoriteDayLabel}</p>
                <FeatureBackoffList items={profile.favoriteDayBackoffs} />
              </div>
            </section>
          </div>

          <article className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h2 className={styles.chartTitle}>Training radar</h2>
              <Link
                href="/research/training-radar"
                className={styles.infoLink}
                aria-label="How training radar is calculated"
              >
                <Info className={styles.infoIcon} aria-hidden="true" strokeWidth={1.9} />
                <span className={styles.infoTooltip} role="tooltip">
                  How is this calculated?
                </span>
              </Link>
            </div>
            <div className={styles.chartWrap}>
              <PublicProfileRadar axes={profile.radarAxes} />
            </div>
          </article>
        </section>

        <section className={styles.statsGrid} aria-label="Public training stats">
          {stats.map((stat) => (
            <article key={stat.label} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </section>

        <section className={styles.splitSection} aria-label={`${profile.displayName} weekly split`}>
          <div className={styles.splitHead}>
            <h2 className={styles.splitTitle}>{profile.currentSplitName}</h2>
            <p className={styles.splitMeta}>{profile.currentSplitLabel}</p>
          </div>

          <div className={styles.splitGrid}>
            {profile.splitDays.length ? (
              profile.splitDays.map((day) => (
                <article
                  key={day.weekday}
                  className={`${styles.splitDayCard} ${day.isRestDay ? styles.splitDayRest : ""}`}
                >
                  <div className={styles.splitDayHead}>
                    <p className={styles.splitDayName}>{day.weekdayLabel}</p>
                    <p className={styles.splitDaySets}>
                      {day.isRestDay
                        ? "Rest"
                        : `${day.totalSets} planned set${day.totalSets === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <p className={styles.splitDayType}>{day.workoutType}</p>
                  {day.isRestDay ? (
                    <p className={styles.splitDayExercises}>Recovery day</p>
                  ) : day.exercises.length ? (
                    <ul className={styles.splitExerciseList}>
                      {day.exercises.map((exercise) => (
                        <li key={`${day.weekday}-${exercise.name}`} className={styles.splitExerciseItem}>
                          <span className={styles.splitExerciseName}>{exercise.name}</span>
                          <span className={styles.splitExerciseSets}>
                            {exercise.sets} set{exercise.sets === 1 ? "" : "s"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.splitDayExercises}>No exercises listed</p>
                  )}
                </article>
              ))
            ) : (
              <article className={styles.splitEmpty}>
                No public split details yet.
              </article>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
