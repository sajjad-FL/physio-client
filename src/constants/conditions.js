/**
 * Physiotherapy conditions used to generate condition × city landing pages at
 * /physio-in/<city>/<condition>.
 *
 * Used by:
 *  - ConditionCityLandingPage (/physio-in/<city>/<condition>)
 *  - CityLandingPage treatment cards (internal links to condition pages)
 *  - Sitemap generation (vite.config.js seoDistFilesPlugin)
 *  - Prerender route list (scripts/prerender.mjs)
 *
 * IMPORTANT — SEO quality: each condition carries genuinely unique symptoms,
 * causes, treatment approach and FAQ so the generated pages are real, useful
 * content and not thin "doorway" pages (which Google penalises). `bookingIssue`
 * must match a value in constants/issues.js ISSUE_OPTIONS so the "Book" CTA can
 * pre-select the condition on /book.
 */
export const CONDITIONS = [
  {
    slug: 'back-pain',
    name: 'Back Pain',
    label: 'Back pain physiotherapy',
    bookingIssue: 'Lower Back Pain',
    searchTerms: [
      'back pain physiotherapy',
      'physiotherapist for back pain at home',
      'sciatica physiotherapy',
      'slip disc physiotherapy',
    ],
    intro:
      'Back pain is the most common reason people look for a physiotherapist. Whether it is a dull ache from sitting all day, a sharp catch when you bend, or sciatica shooting down the leg, targeted home physiotherapy can relieve pain and stop it coming back — without repeated clinic trips.',
    symptoms: [
      'Stiffness or aching in the lower back, worse in the morning or after sitting',
      'Sharp pain when bending, lifting or twisting',
      'Sciatica — pain, numbness or tingling travelling into the buttock or leg',
      'Muscle spasm that locks up the lower back',
      'Difficulty standing upright or walking for long',
    ],
    causes: [
      'Prolonged sitting and poor desk / driving posture',
      'Disc bulge or herniation (slip disc) pressing on a nerve',
      'Lifting heavy loads with the wrong technique',
      'Weak core and gluteal muscles',
      'Age-related wear of the spinal joints',
    ],
    approach:
      'Your physiotherapist first assesses posture, movement and the exact source of pain. Treatment then combines hands-on manual therapy to ease spasm, graded core and back-strengthening exercises, nerve-mobilisation for sciatica, and practical posture and lifting advice tailored to your daily routine at home and work.',
    faq: [
      {
        q: 'Can physiotherapy cure sciatica at home?',
        a: 'Most sciatica from a disc bulge or muscle irritation responds very well to physiotherapy. A structured programme of nerve mobilisation, core strengthening and posture correction usually reduces leg pain within a few sessions, and your physiotherapist teaches you exactly what to avoid so it does not flare again.',
      },
      {
        q: 'How many physiotherapy sessions do I need for back pain?',
        a: 'Simple mechanical back pain often eases within 4–6 sessions, while disc-related or long-standing pain may need a longer programme. Your physiotherapist reviews progress each visit and adjusts the plan.',
      },
    ],
  },
  {
    slug: 'knee-pain',
    name: 'Knee Pain',
    label: 'Knee pain physiotherapy',
    bookingIssue: 'Knee & Joint Pain',
    searchTerms: [
      'knee pain physiotherapy',
      'physiotherapist for knee pain at home',
      'knee replacement rehabilitation',
      'arthritis knee physiotherapy',
    ],
    intro:
      'Knee pain makes stairs, squatting and even walking difficult. Home physiotherapy rebuilds the strength and stability around the joint so you can move confidently again — especially valuable after a knee replacement, when travelling to a clinic is hard.',
    symptoms: [
      'Pain climbing or descending stairs',
      'Swelling and stiffness after activity or in the morning',
      'A feeling that the knee will give way or lock',
      'Grinding or clicking with movement',
      'Difficulty fully straightening or bending the knee',
    ],
    causes: [
      'Osteoarthritis and age-related cartilage wear',
      'Ligament injuries (ACL / MCL) and meniscus tears',
      'Recovery after total or partial knee replacement',
      'Weak thigh (quadriceps) and hip muscles',
      'Overuse from sport or repetitive strain',
    ],
    approach:
      'Treatment focuses on restoring pain-free range of motion, strengthening the quadriceps, hamstrings and hip muscles that protect the knee, and retraining walking and stair patterns. After surgery your physiotherapist follows the surgeon’s protocol, manages swelling and progresses you safely toward full weight-bearing.',
    faq: [
      {
        q: 'When should physiotherapy start after a knee replacement?',
        a: 'Rehabilitation ideally begins within the first days after surgery. Early home physiotherapy controls swelling, restores bending and straightening, and gets you walking safely — which strongly influences the final result. We follow your surgeon’s protocol throughout.',
      },
      {
        q: 'Can physiotherapy help knee arthritis without surgery?',
        a: 'Yes. For many people, strengthening the muscles around an arthritic knee reduces pain and delays or avoids surgery. Your physiotherapist builds a progressive, joint-friendly exercise plan you can continue at home.',
      },
    ],
  },
  {
    slug: 'neck-shoulder-pain',
    name: 'Neck & Shoulder Pain',
    label: 'Neck and shoulder physiotherapy',
    bookingIssue: 'Neck & Spine Pain',
    searchTerms: [
      'neck pain physiotherapy',
      'frozen shoulder physiotherapy at home',
      'cervical spondylosis physiotherapy',
      'shoulder pain physiotherapist',
    ],
    intro:
      'Neck and shoulder pain from desk work, phone use or a frozen shoulder can trigger headaches and limit everyday movement. Home physiotherapy restores mobility and corrects the posture habits driving the pain.',
    symptoms: [
      'Neck stiffness and reduced ability to turn the head',
      'Headaches starting from the base of the skull',
      'Shoulder pain and difficulty raising the arm or reaching behind the back',
      'Tingling or numbness travelling into the arm or hand',
      'Aching between the shoulder blades after screen time',
    ],
    causes: [
      'Cervical spondylosis and age-related neck changes',
      'Frozen shoulder (adhesive capsulitis)',
      'Prolonged desk, laptop and smartphone posture',
      'Whiplash or a previous neck / shoulder injury',
      'Nerve compression in the neck',
    ],
    approach:
      'Your physiotherapist uses gentle joint mobilisation and stretching to restore movement, then strengthens the deep neck and shoulder-blade muscles that hold good posture. For frozen shoulder, a staged range-of-motion programme is key. You also get a practical desk and screen setup to prevent relapse.',
    faq: [
      {
        q: 'How long does frozen shoulder take to recover with physiotherapy?',
        a: 'Frozen shoulder passes through stages and recovery is gradual — often several months — but consistent physiotherapy meaningfully speeds the return of movement and reduces pain at each stage. Regular home sessions make it far easier to stay consistent.',
      },
      {
        q: 'Can neck physiotherapy help my headaches?',
        a: 'Many headaches are “cervicogenic” — they start from stiff, tight neck joints and muscles. Releasing those structures and correcting posture often reduces both the frequency and intensity of these headaches.',
      },
    ],
  },
  {
    slug: 'post-surgery-rehab',
    name: 'Post-Surgery Rehabilitation',
    label: 'Post-surgery rehabilitation',
    bookingIssue: 'Post-Op Rehab',
    searchTerms: [
      'post surgery physiotherapy at home',
      'post operative rehabilitation',
      'physiotherapy after fracture',
      'orthopedic rehabilitation at home',
    ],
    intro:
      'The weeks after surgery decide how well you recover. Home physiotherapy restores movement and strength safely, reduces the risk of complications, and means you do not have to travel while you are still healing.',
    symptoms: [
      'Stiffness and limited movement in the operated area',
      'Weakness and muscle wasting after time in bed or a cast',
      'Swelling around the surgical site',
      'Difficulty walking, climbing stairs or returning to daily tasks',
      'Low confidence to move the healing limb',
    ],
    causes: [
      'Joint replacement (knee, hip, shoulder)',
      'Spinal surgery and disc procedures',
      'Fracture fixation with plates, screws or rods',
      'Ligament reconstruction (e.g. ACL repair)',
      'Prolonged immobilisation after any major operation',
    ],
    approach:
      'Following your surgeon’s protocol, your physiotherapist manages swelling, restores range of motion, and rebuilds strength through carefully progressed exercises. Gait and stair retraining returns you to independence, while scar-aware and wound-safe techniques protect the healing tissue at every stage.',
    faq: [
      {
        q: 'Is home physiotherapy safe soon after surgery?',
        a: 'Yes — in fact early, guided movement is one of the best things for recovery. Your physiotherapist works strictly within your surgeon’s protocol, progressing you only as the tissue heals, which makes home rehabilitation both safe and effective.',
      },
      {
        q: 'What should I keep ready for a post-surgery home session?',
        a: 'Your discharge summary or surgeon’s instructions, any prescribed brace or walker, and a clear space to move. Your physiotherapist brings the clinical assessment and exercise plan to you.',
      },
    ],
  },
  {
    slug: 'stroke-paralysis',
    name: 'Stroke & Paralysis Rehabilitation',
    label: 'Stroke and neuro rehabilitation',
    bookingIssue: 'Stroke / Paralysis',
    searchTerms: [
      'stroke physiotherapy at home',
      'paralysis physiotherapy',
      'neuro rehabilitation at home',
      'physiotherapy for hemiplegia',
    ],
    intro:
      'After a stroke or with paralysis, regular physiotherapy at home is central to regaining movement and independence. Consistent sessions in familiar surroundings — where daily tasks actually happen — help retrain the body and support the whole family.',
    symptoms: [
      'Weakness or paralysis on one side of the body',
      'Difficulty walking, standing or keeping balance',
      'Stiffness or spasticity in an arm or leg',
      'Loss of coordination and fine hand movement',
      'Reduced confidence and fear of falling',
    ],
    causes: [
      'Stroke (ischemic or haemorrhagic)',
      'Spinal cord injury',
      'Nerve injuries causing partial paralysis',
      'Other neurological conditions affecting movement',
      'Prolonged immobility after a neurological event',
    ],
    approach:
      'Neuro physiotherapy uses task-specific, repetitive training to rebuild movement, plus balance and gait work, spasticity management, and strengthening of the affected side. Just as important, your physiotherapist trains family caregivers in safe handling and home exercises so progress continues between visits.',
    faq: [
      {
        q: 'How soon after a stroke should physiotherapy begin?',
        a: 'Rehabilitation should start as early as it is medically safe — often within days. The brain’s ability to relearn movement is greatest in the early months, so consistent home physiotherapy during this window makes a real difference to recovery.',
      },
      {
        q: 'Can physiotherapy help long-standing paralysis?',
        a: 'Even when it has been months or years, physiotherapy can improve strength, balance, mobility and daily independence, and reduce complications like stiffness and contractures. Goals are set realistically around your current ability.',
      },
    ],
  },
  {
    slug: 'sports-injury',
    name: 'Sports Injury',
    label: 'Sports injury physiotherapy',
    bookingIssue: 'Orthopedic Care',
    searchTerms: [
      'sports injury physiotherapy',
      'physiotherapist for muscle strain',
      'ligament sprain rehabilitation',
      'sports physiotherapy at home',
    ],
    intro:
      'A sprain, muscle tear or overuse injury needs the right rehabilitation to heal fully and avoid re-injury. Home physiotherapy gets you back to training with a structured, progressive return-to-sport plan.',
    symptoms: [
      'Sudden pain, swelling or bruising after an injury',
      'A ligament sprain that feels unstable',
      'Muscle strains and tears that limit movement',
      'Tendon pain that worsens with activity',
      'Reduced strength, speed or confidence in the injured area',
    ],
    causes: [
      'Acute trauma — twists, falls and collisions',
      'Overtraining and inadequate recovery',
      'Poor warm-up or technique',
      'Returning to sport too early after a previous injury',
      'Muscle imbalance and weakness',
    ],
    approach:
      'Early management controls swelling and protects the injury, then your physiotherapist progressively loads the tissue to rebuild strength and control. Sport-specific drills and a graded return-to-play plan make sure you come back stronger and reduce the chance of the same injury happening again.',
    faq: [
      {
        q: 'When can I return to sport after an injury?',
        a: 'Return depends on the injury and how the tissue responds to loading, not just time. Your physiotherapist uses strength and movement checks to clear each stage, so you go back only when the area can handle the demands of your sport.',
      },
      {
        q: 'Should I rest completely after a sprain?',
        a: 'Brief protection helps at first, but complete rest for too long weakens the area. Guided early movement and progressive loading heal a sprain better than prolonged rest — which is exactly what a rehabilitation plan provides.',
      },
    ],
  },
]

export const CONDITION_SLUGS = CONDITIONS.map((c) => c.slug)

export function findConditionBySlug(slug) {
  if (!slug) return null
  const needle = String(slug).trim().toLowerCase()
  return CONDITIONS.find((c) => c.slug === needle) || null
}
