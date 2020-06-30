import { orderBy, take } from "lodash";

const ONE_WEEK_IN_MS = 604800000;
export const getTopScore = (database, callback) => {
  database.ref("games")
    .orderByChild("game_end")
    .startAt(Date.now() - ONE_WEEK_IN_MS)
    .endAt(Date.now())
    .once('value')
    .then(values => {
        const value = take(orderBy(values.val(), 'score', 'desc'))[0];
        // console.log("top score should be: ", orderBy(values.val(), 'score', 'desc'));
      // console.log(values)
        callback(value.score, value.name)
    })
}
