# Update the completed 2026 session

These edits are prepared for the site editor. They have not been saved or published in Contentful. Keep the existing section slugs so bookmarked links continue to work.

Publish these edits before deploying the audit code changes. The new search and share descriptions use page content, so deploying first would carry the old registration invitation into those descriptions.

## Update the home-page announcement

Open the [2026 announcement entry](https://app.contentful.com/spaces/v9fs1t81g1do/entries/3kXpQKQjC3h4FXAGpEgAna).

Set its title to **Jeûne 2026 à Froidmont : édition terminée**. Replace its body with these paragraphs:

> La semaine de jeûne du 25 mars au 1er avril 2026 à Froidmont (Rixensart) est terminée.
>
> Les informations sur une prochaine édition seront annoncées ici.
>
> L’édition 2026 était accompagnée par Martine Henao, autour du thème « Jeûner, qu’est-ce que cela change ? ».

In the Accueil page's section order, move this announcement before the introductory quotation.

## Replace the shared registration instructions

Open the [registration entry](https://app.contentful.com/spaces/v9fs1t81g1do/entries/7o2aytsm3cEGEIYpda4kmZ). Accueil, Programme, and Contact share this entry. Edit it once.

Set its title to **Prochaine édition**. Replace its entire body, including the old Google Form link and payment deadline, with:

> Les inscriptions à l’édition du 25 mars au 1er avril 2026 sont closes.
>
> Les dates et modalités d’inscription d’une prochaine édition seront annoncées ici.
>
> Pour toute question, contactez info.jeunonsensemble@gmail.com.

Make the email address a link to `mailto:info.jeunonsensemble@gmail.com`.

## Label the programme as an archive

Open the [programme entry](https://app.contentful.com/spaces/v9fs1t81g1do/entries/AQfBT2XKBVvwxV5g7nOCm).

Set its title to **Programme de l’édition 2026 passée**. Add this paragraph before the existing schedule:

> L’édition 2026 est terminée. Ce programme est conservé à titre d’archive. Les informations sur une prochaine édition seront annoncées ici.

Replace “Rejoignez-nous pour la soirée d‘information” with **Soirée d’information du 1er mars 2026**. Keep the dated schedule below as historical information.

## Verify the published result

After publishing the entries and the changed home-page order, wait for the Contentful webhook build to finish. Check Accueil, Programme, and Contact. The completed-session notice should appear before the home-page quotation. All three pages should show the new registration wording, with no link inviting registration or payment for the past session.

Then build the audit branch from the published CMS content. Check its `description` and `og:description` tags for those three pages before deploying. They should describe the completed edition or future announcements and must not invite registration for March 2026.

The external Google Form has not been changed. If it still accepts responses, close it in Google Forms separately. Add future dates and a new registration link only when the next session is confirmed.
