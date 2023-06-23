# Section 3 Proposed Method
## 3.1 Overview of the proposed method
The proposed algorithm has four steps, as shown in Figure 3. The specific steps are:

1. Transform the image from RGB colour space to Lu'v' colour space and carry out colour clustering on the u'v' plane. Then, the most representative colour centre in each cluster is obtained by calculating the average colour value of each cluster

2. Obtain the cluster centre that is converted into polar coordinates $\left(R,\theta\right)$ according to the intersection point of the confusion line corresponding to the dichromatic type, and the cluster centre with the largest Adjacent Colour Centre Confusion Priority $M_k$ and no unmapped centre remap until all cluster centres have been remapped. The calculation method and the idea of colour centre remapping will be described in Section 3.2. The calculation method for the Adjacent Centre Colour Confusion Priority $M_k$ will be given in Section 3.3

3. For each pixel, and based on the remapping of its cluster centre, perform the same angle $\left ( \theta'_k-\theta_k\right)$ mapping as that for the cluster centre in the polar coordinates

4. Convert $\left(R,\theta\right)$ back to $\left(u',v'\right)$ and calculate the remapped radius $R'$ based on $\left(u',v'\right)$. Using the pixel $R_{ij}$ polar coordinates, the original lightness $L_{ij}$, the average $R$ value of the cluster centre colour radius $\left(\overline{R}\right)$, and the maximum radius difference of the cluster centre colour $\left|R_{max}-R_{min}\right|$, adjust the brightness to obtain $L'_{ij}$ for each pixel. The method is given in Section 3.4

The proposed method is suitable for any type of dichromatic vision. In the following article, we will provide a Daltonization example for protanopes and explain the principles and ideas of the algorithm in detail. Because clustering and colour space conversion are not the focus of our innovation, we will not discuss them in detail in this paper.

The conversion from XYZ colour space to 
 chromaticity space is as follows :
$$
\left\{\begin{aligned}u^{\prime} & =\frac{4 X}{X+15 Y+3 Z} \\v^{\prime} & =\frac{9 Y}{X+15 Y+3 Z}\end{aligned}\right.
$$
where X, Y, and Z represent the three-channel values in XYZ colour space.

## 3.2 Colour centre remapping
We transform the pixel's chroma $\left(u',v'\right)$ into polar form $\left(R,\theta\right)$, and $\left(u',v'\right) = \left(u'_{con'}v'_{con} + R\right)$ is set at 0 angle by the following equation:
$$
\left\{\begin{aligned}
R & =\sqrt{\left(u^{\prime}-u_{c o n}^{\prime}\right)^{2}+\left(v^{\prime}-v_{c o n}^{\prime}\right)^{2}} \\
\theta & =\arcsin \left(\frac{u^{\prime}-u_{c o n}^{\prime}}{R}\right)=\arccos \left(\frac{v^{\prime}-v_{c o n}^{\prime}}{R}\right)
\end{aligned}\right.
$$
where $\left(u'_{con},v'_{con}\right)$ represents the coordinates of the confused intersection lines in $u',v'$ space; for protanopia, $\left(u'_{con},v'_{con}\right)=\left(0.678,0.501\right)$ [34]. When colours confused by CVD patients are grouped in different clusters, it is efficient to measure whether there are confused colours by using the difference of $\theta$
 in the centre of the cluster and then, improve the contrast by remapping $theta$ to achieve chromaticity adjustment.

When remapping the cluster centre, for the colour corresponding to the middle of the confusion line in the three clusters $\theta_k$, the following equation [22] can place the cluster centre map in the middle position (direction of $\left(\theta_{k-1}+\theta_{k+1}\right)/2$) of the adjacent cluster ($\theta_{k-1}$ and $\theta_{k+1}$):
$$
\theta_{k}^{\prime}=\left\{\begin{array}{c}
\theta_{k}-m, \text { if } \frac{1}{2}\left(\theta_{k+1}^{\prime}+\theta_{k-1}^{\prime}\right) \geq \theta_{k}+m \\
\theta_{k}-m, \text { if } \frac{1}{2}\left(\theta_{k+1}^{\prime}+\theta_{k-1}^{\prime}\right) \leq \theta_{k}+m \\
\frac{1}{2}\left(\theta_{k+1}^{\prime}+\theta_{k-1}^{\prime}\right), \text { else }
\end{array}\right.
$$
where $m$ represents a constant that limits the maximum movement distance of the remap, depending on the type of dichromacy. To ensure that the image maintains a largely natural appearance, the value of $m$ should be as small as possible; however, a larger value of $m$ can improve the colour difference effect.
However, for protanopes and deuteranopes, the calculation with this remapping method is not the most balanced, as shown in Figure 4. When rotating by the same angle $\theta$, the change in colour difference (length of $l$) in the perspectives of protanopes and deuteranopes becomes more unbalanced as the angle moves away from the vertical point P. To achieve the optimal colour centre remapping, Equation (4) can be established as follows:
$$
\begin{array}{l}
\tan \left(\theta_{k+1}^{\prime}-\theta_{v}\right)-\tan \left(\theta_{k}^{\prime}-\theta_{v}\right)=\tan \left(\theta_{k}^{\prime}-\theta_{v}\right) \\
\quad-\tan \left(\theta_{k-1}^{\prime}-\theta_{v}\right)
\end{array}
$$
where $\theta_v$ represents the angle corresponding to the intersection of perpendicular lines through a confusion point in the dichromatic gamut. For protanopes, $\theta_v=-1.4988$ and for deuteranopes, $\theta_v=1.6428$.

To ensure a more balanced chromatic aberration of colour contrast for dichromatic vision, the remapping for protanopes and deuteranopes is as Equation (5) (use of Equation (3) is sufficient for tritanopes).
$$
\left\{\begin{array}{l}
\theta_{k}-m, i f \arctan \left(\tan \left(\theta_{k+1}^{\prime}-\theta_{\nu}\right)+\tan \left(\theta_{k-1}^{\prime}-\theta_{\nu}\right)\right) \\
\quad+\theta_{\nu} \geq \theta_{k}+m \\
\quad \theta_{k}-m, i f \arctan \left(\tan \left(\theta_{k+1}^{\prime}-\theta_{\nu}\right)+\tan \left(\theta_{k-1}^{\prime}-\theta_{\nu}\right)\right) \\
\quad+\theta_{\nu} \leq \theta_{k}+m \\
\arctan \left(\frac{1}{2}\left(\tan \left(\theta_{k+1}^{\prime}-\theta_{\nu}\right)+\tan \left(\theta_{k-1}^{\prime}-\theta_{\nu}\right)\right)\right)+\theta_{\nu}, \quad \text { else }
\end{array}\right.
$$
where $\theta'_0$ and $\theta'_{(K+1)}$ represent the approximate angles of the two boundaries in $u'v'$ colour space. For protanopes $\theta'_0=-2.1698$ and $\theta'_{(K+1)}=-1.4600$; for deuteranopes $\theta_v=1.6428$, $\theta'_0=1.7329$ and $\theta'_{(K+1)}=1.9922$; for tritanopes $\theta'_0=-0.4749$ and $\theta'_{(K+1)}=0.3548$.

## 3.3 Adjacent color centre confusion priority

In the second step, we use the calculation of the adjacent colour centre confusion priority $M_k$ as follows:
$$
M_{k}=\left(\theta_{k}^{\prime}-\theta_{k-1}^{\prime}\right)^{2}+\left(\theta_{k+1}^{\prime}-\theta_{k}\right)^{2}, k=1,2 .. K
$$
When the k-th colour centre has not been remapped (when $\theta'_k$ does not exist), $\theta'_k$ ($\theta'_{k-1}$ and $\theta'_{k+1}$ are the same) must be replaced by the value of $\theta_k$.

In colour centre remapping, the adjacent colour centre confusion with the highest priority takes precedence, and it can be ensured that, in the extreme case where the difference between $\theta$ values of multiple colour centres is small, the obvious chroma enhancement result can still be realized.

## 3.4 Lightness modification based on $R$ information

In an image, the colour occupying the main colour information area is affected by the brightness of the light source and the illuminance on the object, and there is not a large difference in its lightness. Based on the assumption that the lightness difference between the main colours of the image is small, we propose a novel lightness modification method based on $R$ information. The lightness modification method is shown in detail in Figure 5.

In the first step, coordinates  $\left(u',v'\right)$ are transformed into polar coordinate form  $\left(R,\theta\right)$ and it can be directly determined from the difference in $\theta$ whether the two different hue colours are easily confused with this type of dichromacy. However, the information in $R$ is not used for remapping, and lightness modification using the information in $R$ can effectively enhance the contrast in different colours confused by CVD patients without affecting the colour consistency.

Without considering the difference in lightness, the distinguishing feature for two colours of different tones that would otherwise be confused is that their $\theta$ information is similar but their $R$ information is quite different. Therefore, combining the information in $R$ to affect a difference in lightness is an effective method in Daltonization.

The dichromatic observer is sensitive to changes in $\theta$ and not sensitive to changes in $R$. Therefore, we can increase (or decrease) the brightness of the colour with a higher $R$ value, leave the brightness of the colour with a medium $R$ value basically unchanged, and reduce (or increase) the brightness of the colour with a lower $R$ value, as follows:
$$
L_{i j}^{\prime}=\frac{b\left(R_{i j}-\overline{R}\right)}{R_{\max }-R_{\min }}+L_{i j}
$$
where $R_{max},R_{min},and\;\overline{R}$ represent maximum, minimum, and average $R$ values for the clustering centre colour, respectively. Parameter $b$ is a constant; note that a larger value of $b$ can make the lightness difference between colours more obvious, but it cannot maintain the natural character of the image. Therefore, the value of $b$ should be chosen appropriately.
With the use of Equation (7), easily confused colours with different tones and small differences in lightness can be assigned a significant difference in lightness, allowing dichromats to distinguish the different colours.