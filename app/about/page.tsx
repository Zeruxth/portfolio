import s from "../page.module.css";

export const metadata = { title: "About — AKI_WIP" };

export default function About() {
  return (
    <>
      <div className={s.head}>
        <span>About</span>
        <span>One person · Haifa, IL</span>
      </div>
      <div className={s.body}>
        <dl className={s.facts}>
          <dt>Name</dt>
          <dd>Aki Yamin</dd>
          <dt>Role</dt>
          <dd>Multidisciplinary visual designer</dd>
          <dt>Based</dt>
          <dd>Haifa, IL</dd>
          <dt>Working since</dt>
          <dd>2019</dd>
          <dt>Mediums</dt>
          <dd>Print · Screen · Motion · Objects</dd>
        </dl>
      </div>
    </>
  );
}
