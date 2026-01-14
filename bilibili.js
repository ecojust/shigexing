import {
  Live,
  User,
  Login,
  Video,
  Comment,
  Dynamic,
  Message,
  BiliCredential,
} from "bilicaptain";

const fetchAV = async () => {
  const SESSDATA =
    "52da2b97%2C1783952036%2C3649b%2A12CjD8J-VqA2p069J5cGqbdWF0DIdmSP57CnREIhFM78m0yBgq91gnLNEYZe60rkEa2McSVkVtNE5MemFlWEE3RW41bWRxOUtKWVBEdjZmcnRFS01FM3pxS3NwYW1mRm9QWVA2NjdCTVVYVllZSVFFRWRjZ28wNUVmU2dwN25saTVNSVc1UWZlbE93IIEC";
  const bili_jct = "09ca606db9d4a103b12d560b21155d84";

  try {
    const video = new Video(
      new BiliCredential(SESSDATA, bili_jct),
      "BV1b4iSByELC"
    );
    const detail = await video.detail();
    // console.log(detail);

    const oid = detail.aid;
    const replies = detail.stat.reply;
    // console.log(video);

    const list = await video.comment.list(2, 0, oid);
    // console.log(list);

    list.forEach((item) => {
      const username = item.member.uname;
      const message = item.content.message;

      console.log(username, "------", message);
    });
  } catch (error) {
    console.log(error);
  }

  //   try {
  //     const oid = 115857632004035;
  //     const type = 1;
  //     const cmt = new Comment(new BiliCredential(SESSDATA, bili_jct), oid, type);
  //     //   console.log(cmt);
  //     const res = await cmt.list(1);
  //     console.log(res);
  //   } catch (error) {
  //     console.log(error);
  //   }
};

fetchAV();
