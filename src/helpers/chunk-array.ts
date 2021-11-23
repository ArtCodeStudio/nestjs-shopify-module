/**
 * Returns an array with arrays of the given size.
 *
 * @param arr array to split
 * @param chunkSize Size of every group
 */
export function chunkArray(arr: Array<any>, chunkSize: number) {
  const tempArray = new Array<any>();

  for (let i = 0; i < arr.length; i += chunkSize) {
    const myChunk = arr.slice(i, i + chunkSize);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}
