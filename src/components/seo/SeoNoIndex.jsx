import { Helmet } from 'react-helmet-async'

/** Use inside authenticated or app-only shells so public search does not index private flows. */
export default function SeoNoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  )
}
