import Database, { sql } from '/lib/interfaces/database.ts';
import { NewsFeed } from '/lib/types.ts';
import { concurrentPromises } from '/lib/utils/misc.ts';
import { crawlNewsFeed } from '/lib/data/news.ts';

const db = new Database();

export async function fetchNewArticles(forceFetch = false) {
  const fourHoursAgo = forceFetch ? new Date() : new Date(new Date().setUTCHours(new Date().getUTCHours() - 4));

  try {
    const feedsToCrawl = await db.query<NewsFeed>(
      sql`SELECT * FROM "bewcloud_news_feeds" WHERE "last_crawled_at" IS NULL OR "last_crawled_at" <= $1 ORDER BY "last_crawled_at" ASC`,
      [
        fourHoursAgo.toISOString(),
      ],
    );

    console.info('Will crawl', feedsToCrawl.length, 'news feeds');

    await concurrentPromises(feedsToCrawl.map((newsFeed) => () => crawlNewsFeed(newsFeed)), 3);

    console.info('Crawled', feedsToCrawl.length, 'news feeds');
  } catch (error) {
    console.error(error);
  }
}
