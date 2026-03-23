# Sprint-3

## Question -> Data -> Insight Lifecycle in Data Science

Data science starts with a decision problem, not a dataset. The Question -> Data -> Insight lifecycle helps keep work focused on outcomes that matter.

### 1. Question: Define the decision before touching data

A clear question identifies:
- Who needs the answer
- What decision they are trying to make
- What success looks like
- What time frame and constraints matter

This is critical because data work is expensive in time and attention. If the question is vague, every later step becomes guesswork: we collect the wrong data, run irrelevant analysis, and produce results nobody can act on.

In practice, a strong question is specific and decision-oriented. For example, instead of asking "What does customer behavior look like?" a better question is "Which customer behaviors in the first 14 days best predict 90-day retention, so we can prioritize onboarding interventions?"

### 2. Data: Use evidence that matches the question

Data is evidence for (or against) possible explanations. But before analysis, we need to understand:
- What each field actually means in business terms
- How and when data was collected
- What is missing, noisy, delayed, or biased
- Whether the granularity fits the question (user-level, session-level, daily, etc.)

Understanding data before analyzing it prevents false confidence. A clean chart can still be wrong if the underlying data generation process is misunderstood.

So this step is not "load and model." It is "validate whether this evidence is fit for the question." If not, we revise the question, gather additional data, or narrow scope.

### 3. Insight: Produce meaning that changes decisions

Insights are not raw numbers. An insight connects evidence to action.

Example structure:
- Observation: Users who complete onboarding checklist have 2.1x higher 90-day retention.
- Interpretation: Early product activation appears to drive long-term stickiness.
- Action: Prioritize checklist completion experiments for new users in week 1.

Insights emerge through exploration, iteration, and context. Tools and models help, but they do not replace reasoning. The goal is not to "find patterns" randomly; it is to discover patterns that are relevant to the original decision.

### How the steps connect

The lifecycle is a chain:
- The question determines what data is relevant.
- The data quality and meaning determine which conclusions are credible.
- Credible conclusions become insights only when tied to an actual decision.

If one step is weak, the entire chain weakens. Strong data science is disciplined alignment across all three.

## Applying the Lifecycle to a Project Context

### Project scenario

I will use a realistic e-commerce context:
An online store has high cart abandonment and wants to improve completed purchases.

### Question

"Which factors during a shopper session are most associated with cart abandonment, and which of those factors are realistically changeable in the checkout experience?"

Why this question is useful:
- It targets a specific business outcome (conversion)
- It narrows scope to actionable factors, not just correlations
- It frames analysis around intervention, not description

### Data needed

Types of data and what they represent:
- Session behavior logs: page views, add-to-cart events, checkout steps, exit points
- Transaction records: completed purchases, order value, payment method
- UX/performance data: page load time, error rates, failed payment attempts
- Device and channel data: mobile/desktop, traffic source, campaign tags

Possible sources:
- Web analytics platform
- Application event tracking
- Order management/payment system
- Experiment logs if A/B tests already exist

What matters before analysis:
- Event timestamps are consistent across systems
- Session IDs can be joined reliably
- "Abandoned cart" is explicitly defined (for example, no purchase within 24 hours)

### Useful insight for decision-making

An example of a useful insight:
"Mobile users with checkout load times above 4 seconds abandon at significantly higher rates, especially at the payment step. Reducing payment-page load time is likely a higher-impact intervention than adding new discount banners."

Why this is useful:
- It identifies a concrete bottleneck
- It points to a specific, testable action
- It supports prioritization of engineering and product resources

## Video Walkthrough Guide (Approx. 2 Minutes)

Use this structure while recording:

1. Opening (15-20 seconds)
- State that your README explains how data science should start with a clear question, then move to data as evidence, then to actionable insight.

2. Lifecycle explanation (45-60 seconds)
- Explain that the question defines the decision.
- Explain that data must be understood in context before analysis.
- Explain that insight means evidence plus interpretation plus action.

3. Project scenario application (30-40 seconds)
- Walk through your e-commerce cart-abandonment example.
- State the question, needed data, and one useful insight that could drive a business decision.

4. Mandatory scenario response (35-45 seconds)
- Prompt: "We have many columns, no problem statement, let us model first."
- Your response:
	- First, pause and define the decision question with stakeholders.
	- Then audit the dataset for relevance and quality against that question.
	- Risks of skipping steps: spurious patterns, wasted effort, misleading conclusions, and no actionable outcome.
	- Realignment: translate business need into a clear question, map needed evidence, then explore toward decision-oriented insight.

## Scenario-Based Reasoning Script (Verbal)

If I were given many columns but no clear problem statement, I would not start by modeling immediately. I would first ask what decision the team is trying to make, because without that, we cannot judge whether any pattern is useful. Next, I would profile the data to check what each column represents, whether quality is acceptable, and whether the data actually relates to that decision. If we skip those steps, we risk producing attractive but meaningless outputs, overfitting noise, and recommending actions that do not solve a real problem. I would realign the project by defining one clear question, selecting evidence that directly supports it, and only then doing exploration to produce insights that can drive a concrete decision.